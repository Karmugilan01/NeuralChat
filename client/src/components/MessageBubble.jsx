import { useState } from 'react';
import { Copy, Check, User, Bot } from 'lucide-react';

// Simple markdown renderer (no external dep needed for basics)
function renderMarkdown(text) {
  // Code blocks
  text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="code-block" data-lang="${lang || ''}" ><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Headers
  text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Lists
  text = text.replace(/^- (.+)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>(\n)?)+/g, m => `<ul>${m}</ul>`);

  // Numbered lists
  text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Blockquote
  text = text.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Line breaks
  text = text.replace(/\n\n/g, '</p><p>');
  text = '<p>' + text + '</p>';
  text = text.replace(/<p><\/p>/g, '');

  return text;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'relative',
      background: '#0d1117',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      margin: '10px 0',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 12px',
        background: '#161b22',
        borderBottom: '1px solid var(--border)'
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {lang || 'code'}
        </span>
        <button onClick={copy} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: copied ? 'var(--success)' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
          fontFamily: 'var(--font-sans)', transition: 'color 0.15s'
        }}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{
        padding: '14px 16px',
        overflowX: 'auto',
        margin: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: 12.5,
        lineHeight: 1.6,
        color: '#e6edf3'
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // Parse the content - extract code blocks first, then render rest as markdown
  const renderContent = (content) => {
    const parts = [];
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        parts.push({ type: 'text', content: textBefore });
      }
      parts.push({ type: 'code', lang: match[1] || '', code: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    if (parts.length === 0) {
      parts.push({ type: 'text', content });
    }

    return parts;
  };

  const renderInlineMarkdown = (text) => {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code style="background:#1a1a2e;padding:2px 5px;border-radius:3px;font-family:var(--font-mono);font-size:0.9em">$1</code>');
    return text;
  };

  const renderText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 15, margin: '12px 0 6px', color: 'var(--text-primary)' }}>{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 17, margin: '14px 0 6px', color: 'var(--text-primary)' }}>{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: 19, margin: '16px 0 8px', color: 'var(--text-primary)' }}>{line.slice(2)}</h1>;
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0' }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>▸</span>
          <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.slice(2)) }} />
        </div>;
      }
      if (/^\d+\. /.test(line)) {
        const num = line.match(/^(\d+)\. /)[1];
        return <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0' }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, minWidth: 16, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.replace(/^\d+\. /, '')) }} />
        </div>;
      }
      if (line.startsWith('> ')) {
        return <blockquote key={i} style={{
          borderLeft: '3px solid var(--accent-dim)', paddingLeft: 12, margin: '8px 0',
          color: 'var(--text-secondary)', fontStyle: 'italic'
        }}>
          <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.slice(2)) }} />
        </blockquote>;
      }
      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
      return <p key={i} style={{ margin: '3px 0' }} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line) }} />;
    });
  };

  const parts = renderContent(message.content);

  return (
    <div
      className={`message-bubble fade-in ${isUser ? 'message-bubble--user' : 'message-bubble--ai'}`}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 12,
        padding: '6px 0',
        alignItems: 'flex-start'
      }}
      onMouseEnter={e => e.currentTarget.querySelector('.msg-actions').style.opacity = '1'}
      onMouseLeave={e => e.currentTarget.querySelector('.msg-actions').style.opacity = '0'}
    >
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, flexShrink: 0,
        borderRadius: isUser ? '50%' : '10px',
        background: isUser ? 'var(--user-border)' : 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isUser ? 'none' : '0 0 12px var(--accent-dim)',
        marginTop: 2
      }}>
        {isUser
          ? <User size={14} color="rgba(255,255,255,0.8)" />
          : <Bot size={14} color="#fff" />
        }
      </div>

      {/* Content */}
      <div className="message-bubble__content-wrapper" style={{ maxWidth: '75%', minWidth: 60 }}>
        <div className="message-bubble__content" style={{
          padding: '11px 15px',
          borderRadius: isUser
            ? 'var(--radius) var(--radius-sm) var(--radius) var(--radius)'
            : 'var(--radius-sm) var(--radius) var(--radius) var(--radius)',
          background: isUser ? 'var(--user-bg)' : 'var(--ai-bg)',
          border: '1px solid',
          borderColor: isUser ? 'var(--user-border)' : 'var(--ai-border)',
          fontSize: 13.5,
          lineHeight: 1.65,
          color: 'var(--text-primary)'
        }}>
          {parts.map((part, i) =>
            part.type === 'code'
              ? <CodeBlock key={i} code={part.code} lang={part.lang} />
              : <div key={i}>{renderText(part.content)}</div>
          )}

          {/* Streaming cursor */}
          {isStreaming && (
            <span style={{
              display: 'inline-block',
              width: 2, height: 14,
              background: 'var(--accent)',
              marginLeft: 2,
              borderRadius: 1,
              animation: 'blink 1s step-end infinite',
              verticalAlign: 'middle'
            }} />
          )}
        </div>

        {/* Timestamp + actions */}
        <div className="msg-actions" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 4,
          opacity: 0,
          transition: 'opacity 0.15s',
          justifyContent: isUser ? 'flex-end' : 'flex-start'
        }}>
          {message.timestamp && (
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
              {formatTime(message.timestamp)}
            </span>
          )}
          <button onClick={copyMessage} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: copied ? 'var(--success)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 10.5, fontFamily: 'var(--font-sans)',
            transition: 'color 0.15s', padding: '1px 4px'
          }}>
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
