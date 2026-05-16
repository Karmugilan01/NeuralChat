import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  tokens: { type: Number, default: 0 }
});

const conversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: 'New Conversation' },
  systemPrompt: {
    type: String,
    default: 'You are a helpful, thoughtful AI assistant. Be concise, clear, and friendly.'
  },
  model: { type: String, default: 'gpt-4o-mini' },
  provider: { type: String, default: 'openai' },
  messages: [messageSchema],
  totalTokens: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

conversationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Auto-generate title from first user message
conversationSchema.methods.generateTitle = function () {
  const firstUserMsg = this.messages.find(m => m.role === 'user');
  if (firstUserMsg) {
    this.title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
  }
};

export const Conversation = mongoose.model('Conversation', conversationSchema);
