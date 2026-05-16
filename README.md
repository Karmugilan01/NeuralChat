# NeuralChat — AI Chat App with Memory

A full-stack AI chatbot with persistent conversation history, streaming responses (SSE), and a system prompt editor. Supports OpenAI, Google Gemini, and Anthropic Claude.

## Features

- 💬 **Persistent Memory** — Conversation history stored in MongoDB
- ⚡ **Streaming Responses** — Real-time token streaming via Server-Sent Events (SSE)
- 🎭 **System Prompt Editor** — Customize the AI's role with presets or custom prompts
- 🤖 **Multi-Provider** — Switch between OpenAI, Gemini, and Anthropic
- 🔀 **Model Selector** — Choose any supported model per conversation
- 📋 **Markdown Rendering** — Code blocks, lists, headers, inline formatting
- 🗂️ **Conversation Sidebar** — Search, select, and delete chats
- 🌙 **Dark Theme** — Clean, minimal dark UI

## Project Structure

```
ai-chat-app/
├── server/               # Node.js + Express backend
│   ├── index.js          # Main server with SSE streaming
│   ├── ai.js             # AI provider abstraction (OpenAI/Gemini/Anthropic)
│   ├── models.js         # MongoDB/Mongoose schemas
│   ├── package.json
│   └── .env.example      # Environment variables template
│
└── client/               # React frontend
    ├── src/
    │   ├── App.jsx               # Root component
    │   ├── main.jsx              # Entry point
    │   ├── components/
    │   │   ├── Sidebar.jsx           # Conversation list
    │   │   ├── SystemPromptEditor.jsx # Prompt + model config
    │   │   ├── MessageBubble.jsx     # Chat message with markdown
    │   │   └── ChatInput.jsx         # Message input + send
    │   ├── hooks/
    │   │   └── useChat.js        # Main state management hook
    │   ├── utils/
    │   │   └── api.js            # API client + SSE streaming
    │   └── styles/
    │       └── global.css        # Design system & CSS variables
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Setup

### 1. Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `.env`:

```env
# Required: MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-chat

# Required: At least one AI provider key
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...          # Optional
ANTHROPIC_API_KEY=sk-ant-... # Optional

# Default provider (openai | gemini | anthropic)
AI_PROVIDER=openai

PORT=3001
```

### 4. Run the App

**Terminal 1 — Start the backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Start the frontend:**
```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/conversations` | List all conversations |
| POST | `/api/conversations` | Create new conversation |
| GET | `/api/conversations/:id` | Get conversation with messages |
| PATCH | `/api/conversations/:id` | Update system prompt / model |
| DELETE | `/api/conversations/:id` | Delete conversation |
| DELETE | `/api/conversations/:id/messages` | Clear messages |
| POST | `/api/conversations/:id/stream` | **SSE streaming chat** |
| GET | `/api/models` | List available models |
| GET | `/api/health` | Health check |

## Streaming Architecture

The `/stream` endpoint uses **Server-Sent Events (SSE)**:

```
POST /api/conversations/:id/stream
Body: { message: "Hello!" }

← data: {"type":"start","model":"gpt-4o-mini","provider":"openai"}
← data: {"type":"chunk","text":"Hello"}
← data: {"type":"chunk","text":"! How"}
← data: {"type":"chunk","text":" can I help?"}
← data: {"type":"done","messageCount":4,"title":"Hello! How can..."}
```

The client reads this with the Fetch Streams API (`ReadableStream`) — no external SSE library needed.

## Switching AI Providers

In any conversation, open the **System Prompt & Model** panel at the top of the chat and select a different provider/model. Changes apply immediately to the next message.

### Supported Models

| Provider | Models |
|----------|--------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo |
| Gemini | gemini-1.5-pro, gemini-1.5-flash, gemini-pro |
| Anthropic | claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5 |

## Extending

- **Add a model**: Edit the `MODELS` object in `server/ai.js`
- **Add a provider**: Add a new `stream*` function in `server/ai.js` and register it in `streamChat()`
- **Custom presets**: Edit the `PRESETS` array in `client/src/components/SystemPromptEditor.jsx`
- **Message retention**: Adjust `limit(50)` in the conversations list endpoint
