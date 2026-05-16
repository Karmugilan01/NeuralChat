import { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

export function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  return (
    <div style={{
      padding: '14px 20px 18px',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg)'
    }}>
      <div style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-end',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '10px 12px',
        transition: 'border-color 0.2s, box-shadow 0.2s'
      }}
        onFocusCapture={e => {
          e.currentTarget.style.borderColor = 'var(--accent-dim)';
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)';
        }}
        onBlurCapture={e => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'AI is thinking…' : 'Message the AI… (Enter to send, Shift+Enter for newline)'}
          rows={1}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            lineHeight: 1.5,
            maxHeight: 200,
            overflow: 'auto'
          }}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          style={{
            width: 34, height: 34, flexShrink: 0,
            background: (!text.trim() || disabled) ? 'var(--bg-hover)' : 'var(--accent)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: (!text.trim() || disabled) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s, box-shadow 0.15s',
            boxShadow: (!text.trim() || disabled) ? 'none' : '0 0 12px var(--accent-dim)'
          }}
        >
          <Send size={15} color={(!text.trim() || disabled) ? 'var(--text-muted)' : '#fff'} />
        </button>
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: 8,
        fontSize: 11,
        color: 'var(--text-muted)'
      }}>
        {disabled
          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.2s ease infinite' }} />
            Generating response…
          </span>
          : 'AI can make mistakes. Double-check important info.'
        }
      </div>
    </div>
  );
}
