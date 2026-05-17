# NeuralChat — AI Chat App with Memory

A full-stack AI chatbot with persistent conversation history, streaming responses (SSE), and a system prompt editor. Powered by Groq API for ultra-fast inference.

## Features

- 💬 **Persistent Memory** — Conversation history stored in MongoDB
- ⚡ **Streaming Responses** — Real-time token streaming using Server-Sent Events (SSE)
- 🎭 **System Prompt Editor** — Customize the AI’s behavior with presets or custom prompts
- 🚀 **Groq API Integration** — High-speed inference with Groq-supported LLMs
- 🔀 **Model Selector** — Switch models dynamically per conversation
- 📋 **Markdown Rendering** — Supports code blocks, lists, tables, and formatting
- 🗂️ **Conversation Sidebar** — Search, select, and delete chats
- 🌙 **Dark Theme UI** — Minimal and modern interface
- 🧠 **Context-Aware Chat** — Maintains chat history for memory-based conversations

---

## Tech Stack

### Frontend
- React
- Vite
- CSS Modules / Custom CSS
- Fetch Streams API

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Groq SDK/API
- SSE (Server-Sent Events)

---

## Project Structure

```bash
ai-chat-app/
├── server/                      # Node.js + Express backend
│   ├── index.js                 # Main server with SSE streaming
│   ├── ai.js                    # Groq API integration
│   ├── models.js                # MongoDB schemas
│   ├── package.json
│   └── .env.example             # Environment variables template
│
└── client/                      # React frontend
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── SystemPromptEditor.jsx
    │   │   ├── MessageBubble.jsx
    │   │   └── ChatInput.jsx
    │   ├── hooks/
    │   │   └── useChat.js
    │   ├── utils/
    │   │   └── api.js
    │   └── styles/
    │       └── global.css
    ├── index.html
    ├── vite.config.js
    └── package.json
