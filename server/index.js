import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { Conversation } from './models.js';
import { streamChat, MODELS } from './ai.js';

const app = express();
const PORT = process.env.PORT || 3001;

/* ─────────────────────────────────────────────
   TRUST PROXY
───────────────────────────────────────────── */

app.set('trust proxy', 1);

/* ─────────────────────────────────────────────
   CORS FIX
───────────────────────────────────────────── */

const allowedOrigins = [
  'http://localhost:5173',
  'https://neural-chat-ten.vercel.app',
  'https://neural-chat-5kyf7kevz-karmugilans-projects-b5b79ee8.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {

      // allow requests without origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },

    methods: [
      'GET',
      'POST',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ],

    credentials: true
  })
);

/* HANDLE PREFLIGHT */

app.options('*', cors());

/* EXTRA HEADERS */

app.use((req, res, next) => {

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS'
  );

  res.header(
    'Access-Control-Allow-Credentials',
    'true'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

/* ─────────────────────────────────────────────
   MONGODB
───────────────────────────────────────────── */

mongoose.connect(
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/ai-chat'
)
.then(() => {
  console.log('✅ MongoDB connected');
})
.catch((err) => {
  console.error('❌ MongoDB Error:', err);
});

/* ─────────────────────────────────────────────
   ROOT
───────────────────────────────────────────── */

app.get('/', (req, res) => {

  res.json({
    status: 'ok',
    message: 'NeuralChat API is running'
  });
});

/* ─────────────────────────────────────────────
   GET ALL CONVERSATIONS
───────────────────────────────────────────── */

app.get('/api/conversations', async (req, res) => {

  try {

    const conversations = await Conversation.find()
      .select(
        'sessionId title model provider createdAt updatedAt totalTokens'
      )
      .sort({ updatedAt: -1 })
      .limit(50);

    res.json(conversations);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

/* ─────────────────────────────────────────────
   GET SINGLE CONVERSATION
───────────────────────────────────────────── */

app.get('/api/conversations/:sessionId', async (req, res) => {

  try {

    const conv = await Conversation.findOne({
      sessionId: req.params.sessionId
    });

    if (!conv) {

      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    res.json(conv);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

/* ─────────────────────────────────────────────
   CREATE CONVERSATION
───────────────────────────────────────────── */

app.post('/api/conversations', async (req, res) => {

  try {

    const {
      systemPrompt,
      model,
      provider
    } = req.body;

    const conv = new Conversation({
      sessionId: uuidv4(),
      systemPrompt: systemPrompt || '',
      model: model || 'llama-3.3-70b-versatile',
      provider: provider || 'groq'
    });

    await conv.save();

    res.json(conv);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

/* ─────────────────────────────────────────────
   UPDATE CONVERSATION
───────────────────────────────────────────── */

app.patch('/api/conversations/:sessionId', async (req, res) => {

  try {

    const {
      systemPrompt,
      model,
      provider,
      title
    } = req.body;

    const conv = await Conversation.findOne({
      sessionId: req.params.sessionId
    });

    if (!conv) {

      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    if (systemPrompt !== undefined) {
      conv.systemPrompt = systemPrompt;
    }

    if (model !== undefined) {
      conv.model = model;
    }

    if (provider !== undefined) {
      conv.provider = provider;
    }

    if (title !== undefined) {
      conv.title = title;
    }

    await conv.save();

    res.json(conv);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

/* ─────────────────────────────────────────────
   DELETE CONVERSATION
───────────────────────────────────────────── */

app.delete('/api/conversations/:sessionId', async (req, res) => {

  try {

    await Conversation.deleteOne({
      sessionId: req.params.sessionId
    });

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

/* ─────────────────────────────────────────────
   CLEAR MESSAGES
───────────────────────────────────────────── */

app.delete('/api/conversations/:sessionId/messages', async (req, res) => {

  try {

    const conv = await Conversation.findOne({
      sessionId: req.params.sessionId
    });

    if (!conv) {

      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    conv.messages = [];
    conv.totalTokens = 0;
    conv.title = 'New Conversation';

    await conv.save();

    res.json(conv);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

/* ─────────────────────────────────────────────
   STREAM CHAT
───────────────────────────────────────────── */

app.post('/api/conversations/:sessionId/stream', async (req, res) => {

  const { message } = req.body;

  if (!message?.trim()) {

    return res.status(400).json({
      error: 'Message is required'
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.flushHeaders();

  const sendEvent = (type, data = {}) => {

    res.write(
      `data: ${JSON.stringify({
        type,
        ...data
      })}\n\n`
    );
  };

  try {

    const conv = await Conversation.findOne({
      sessionId: req.params.sessionId
    });

    if (!conv) {

      sendEvent('error', {
        message: 'Conversation not found'
      });

      return res.end();
    }

    conv.messages.push({
      role: 'user',
      content: message
    });

    const userMessages = conv.messages.filter(
      (m) => m.role === 'user'
    );

    if (userMessages.length === 1) {
      conv.generateTitle();
    }

    sendEvent('start', {
      model: conv.model,
      provider: conv.provider
    });

    let fullResponse = '';

    fullResponse = await streamChat({
      provider: conv.provider,
      model: conv.model,
      systemPrompt: conv.systemPrompt,
      messages: conv.messages.map((m) => ({
        role: m.role,
        content: m.content
      })),

      onChunk: (chunk) => {

        sendEvent('chunk', {
          text: chunk
        });
      }
    });

    conv.messages.push({
      role: 'assistant',
      content: fullResponse
    });

    await conv.save();

    sendEvent('done', {
      messageCount: conv.messages.length,
      title: conv.title
    });

  } catch (err) {

    console.error('❌ Stream Error:', err);

    sendEvent('error', {
      message: err.message || 'Streaming failed'
    });

  } finally {

    res.end();
  }
});

/* ─────────────────────────────────────────────
   MODELS
───────────────────────────────────────────── */

app.get('/api/models', (req, res) => {
  res.json(MODELS);
});

/* ─────────────────────────────────────────────
   HEALTH
───────────────────────────────────────────── */

app.get('/api/health', (req, res) => {

  res.json({
    status: 'ok',
    mongodb:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected',
    provider: 'groq'
  });
});

/* ─────────────────────────────────────────────
   404
───────────────────────────────────────────── */

app.use((req, res) => {

  res.status(404).json({
    error: 'Route not found'
  });
});

/* ─────────────────────────────────────────────
   START SERVER
───────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
