import { useEffect, useRef, useState } from 'react';
import { Trash2, AlertCircle, X, Sparkles, MessageSquare } from 'lucide-react';
import { Sidebar } from './components/Sidebar.jsx';
import { SystemPromptEditor } from './components/SystemPromptEditor.jsx';
import { MessageBubble } from './components/MessageBubble.jsx';
import { ChatInput } from './components/ChatInput.jsx';
import { useChat } from './hooks/useChat.js';
import './styles/global.css';

function EmptyState({ onCreate }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, padding: 40, textAlign: 'center'
    }}>
      <div style={{
        width: 64, height: 64,
        background: 'var(--accent-glow)',
        border: '1px solid var(--accent-dim)',
        borderRadius: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Sparkles size={28} color="var(--accent)" />
      </div>

      <div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 400, marginBottom: 8 }}>
          Start a Conversation
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 340, lineHeight: 1.6 }}>
          NeuralChat remembers your conversations and supports streaming responses.
          Customize the AI's behavior with system prompts.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: '🧠', label: 'Persistent Memory', desc: 'Saved to MongoDB' },
          { icon: '⚡', label: 'Live Streaming', desc: 'Real-time via SSE' },
          { icon: '🎭', label: 'Custom Persona', desc: 'System prompt editor' },
        ].map(f => (
          <div key={f.label} style={{
            padding: '12px 16px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            minWidth: 130, textAlign: 'center'
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <button onClick={() => onCreate()} style={{
        padding: '11px 24px',
        background: 'var(--accent)',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        color: '#fff',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        boxShadow: '0 0 24px var(--accent-dim)',
        transition: 'background 0.15s'
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
      >
        New Conversation →
      </button>
    </div>
  );
}

export default function App() {
  const {
    conversations, activeConversation, isStreaming, streamingText,
    isLoading, error, loadConversations, selectConversation,
    createConversation, deleteConversation, sendMessage,
    updateConversation, clearMessages, setError
  } = useChat();

  const messagesEndRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, streamingText]);

  // Build messages to display
  const displayMessages = activeConversation?.messages || [];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg)'
    }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          conversations={conversations}
          activeId={activeConversation?.sessionId}
          onSelect={selectConversation}
          onCreate={createConversation}
          onDelete={deleteConversation}
        />
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: 'var(--header-h)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          background: 'var(--bg-elevated)',
          flexShrink: 0
        }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 5, borderRadius: 6,
              display: 'flex', alignItems: 'center', transition: 'color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <MessageSquare size={16} />
          </button>

          <div style={{ flex: 1 }}>
            {activeConversation ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {activeConversation.title}
                </h1>
                <span style={{
                  fontSize: 11, color: 'var(--text-muted)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  padding: '2px 8px', borderRadius: 20
                }}>
                  {displayMessages.length} messages
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Select or create a conversation</span>
            )}
          </div>

          {activeConversation && (
            <button
              onClick={clearMessages}
              title="Clear messages"
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--error)';
                e.currentTarget.style.borderColor = 'var(--error)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <Trash2 size={11} />
              Clear
            </button>
          )}
        </header>

        {/* Error banner */}
        {error && (
          <div style={{
            background: 'rgba(255, 95, 106, 0.1)',
            borderBottom: '1px solid rgba(255, 95, 106, 0.3)',
            padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: 'var(--error)'
          }}>
            <AlertCircle size={14} />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--error)', display: 'flex'
            }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* System Prompt Editor */}
        {activeConversation && (
          <SystemPromptEditor
            conversation={activeConversation}
            onUpdate={updateConversation}
          />
        )}

        {/* Messages area */}
        {!activeConversation ? (
          <EmptyState onCreate={createConversation} />
        ) : isLoading ? (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: 13
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 32, height: 32,
                border: '2px solid var(--border)',
                borderTop: '2px solid var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px'
              }} />
              Loading conversation…
            </div>
          </div>
        ) : (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px'
          }}>
            {displayMessages.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                color: 'var(--text-muted)', fontSize: 13
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
                Send a message to begin
              </div>
            ) : (
              displayMessages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  message={msg}
                  isStreaming={false}
                />
              ))
            )}

            {/* Streaming message */}
            {isStreaming && streamingText && (
              <MessageBubble
                message={{ role: 'assistant', content: streamingText }}
                isStreaming={true}
              />
            )}

            {/* Loading dots when streaming but no text yet */}
            {isStreaming && !streamingText && (
              <div className="fade-in" style={{
                display: 'flex', gap: 12, padding: '6px 0', alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 30, height: 30, flexShrink: 0,
                  borderRadius: '10px',
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 12px var(--accent-dim)'
                }}>
                  <span style={{ fontSize: 12 }}>✦</span>
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--ai-bg)',
                  border: '1px solid var(--ai-border)',
                  borderRadius: 'var(--radius-sm) var(--radius) var(--radius) var(--radius)',
                  display: 'flex', gap: 5, alignItems: 'center'
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--accent)',
                      animation: `pulse 1.2s ease ${i * 0.2}s infinite`
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        {activeConversation && (
          <ChatInput onSend={sendMessage} disabled={isStreaming} />
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
