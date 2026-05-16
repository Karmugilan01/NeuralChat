import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Trash2, Search, Bot } from 'lucide-react';

export function Sidebar({ conversations, activeId, onSelect, onCreate, onDelete }) {
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  function formatTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      borderRight: '1px solid var(--border)',
      background: 'var(--bg-elevated)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0
    }}>
      {/* Logo */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--accent)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px var(--accent-dim)'
        }}>
          <Bot size={16} color="#fff" />
        </div>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text-primary)' }}>
          NeuralChat
        </span>
      </div>

      {/* New Chat Button */}
      <div style={{ padding: '12px' }}>
        <button onClick={() => onCreate()} style={{
          width: '100%',
          padding: '9px 14px',
          background: 'var(--accent)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          color: '#fff',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'background 0.15s',
          boxShadow: '0 0 20px var(--accent-dim)'
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >
          <Plus size={15} />
          New Conversation
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '0 12px 10px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{
            position: 'absolute', left: 9, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)'
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chats..."
            style={{
              width: '100%',
              padding: '7px 10px 7px 28px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 16px',
            color: 'var(--text-muted)', fontSize: 12
          }}>
            {search ? 'No matches found' : 'No conversations yet'}
          </div>
        )}

        {filtered.map(conv => (
          <div
            key={conv.sessionId}
            onClick={() => onSelect(conv.sessionId)}
            className={conv.sessionId === activeId ? '' : ''}
            style={{
              padding: '10px 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              background: conv.sessionId === activeId ? 'var(--bg-active)' : 'transparent',
              border: '1px solid',
              borderColor: conv.sessionId === activeId ? 'var(--border-light)' : 'transparent',
              marginBottom: 2,
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
              position: 'relative',
              group: true
            }}
            onMouseEnter={e => {
              if (conv.sessionId !== activeId) {
                e.currentTarget.style.background = 'var(--bg-hover)';
              }
              e.currentTarget.querySelector('.delete-btn').style.opacity = '1';
            }}
            onMouseLeave={e => {
              if (conv.sessionId !== activeId) {
                e.currentTarget.style.background = 'transparent';
              }
              e.currentTarget.querySelector('.delete-btn').style.opacity = '0';
            }}
          >
            <MessageSquare size={13} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12.5,
                color: conv.sessionId === activeId ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: conv.sessionId === activeId ? 500 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.4
              }}>
                {conv.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {formatTime(conv.updatedAt)}
              </div>
            </div>

            {/* Delete button */}
            <button
              className="delete-btn"
              onClick={e => {
                e.stopPropagation();
                if (confirmDelete === conv.sessionId) {
                  onDelete(conv.sessionId);
                  setConfirmDelete(null);
                } else {
                  setConfirmDelete(conv.sessionId);
                  setTimeout(() => setConfirmDelete(null), 3000);
                }
              }}
              title={confirmDelete === conv.sessionId ? 'Click again to confirm' : 'Delete'}
              style={{
                opacity: 0,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: confirmDelete === conv.sessionId ? 'var(--error)' : 'var(--text-muted)',
                padding: 2,
                flexShrink: 0,
                transition: 'opacity 0.15s, color 0.15s',
                display: 'flex'
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
