import { useState, useEffect } from 'react';
import { Settings, ChevronDown, ChevronUp, Wand2, RotateCcw, Check } from 'lucide-react';

const PRESETS = [
  {
    label: 'Helpful Assistant',
    prompt: 'You are a helpful, thoughtful AI assistant. Be concise, clear, and friendly.'
  },
  {
    label: 'Code Expert',
    prompt: 'You are an expert software engineer. Provide precise, well-commented code with explanations. Prefer modern best practices and mention trade-offs when relevant.'
  },
  {
    label: 'Creative Writer',
    prompt: 'You are a creative writing partner with a gift for vivid imagery and compelling narrative. Help brainstorm, draft, and refine stories, poems, and other creative work.'
  },
  {
    label: 'Socratic Teacher',
    prompt: 'You are a Socratic tutor. Instead of giving direct answers, guide the user to discover insights through thoughtful questions. Encourage critical thinking.'
  },
  {
    label: 'Concise Expert',
    prompt: 'You are a knowledgeable expert. Give direct, accurate answers with no fluff. Use bullet points when listing multiple items. Never pad your responses.'
  },
  {
    label: 'Debate Partner',
    prompt: 'You are a sharp debate partner. Present the strongest possible counter-arguments to whatever position the user takes, even if you personally agree with them.'
  }
];

export function SystemPromptEditor({ conversation, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [saved, setSaved] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [models, setModels] = useState({});

  useEffect(() => {
    if (conversation) {
      setPrompt(conversation.systemPrompt || '');
      setSelectedModel(conversation.model || '');
      setSelectedProvider(conversation.provider || 'openai');
    }
  }, [conversation?.sessionId]);

  useEffect(() => {
    fetch('/api/models')
      .then(r => r.json())
      .then(setModels)
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    await onUpdate({
      systemPrompt: prompt,
      model: selectedModel,
      provider: selectedProvider
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const applyPreset = (preset) => {
    setPrompt(preset.prompt);
  };

  if (!conversation) return null;

  return (
    <div className="system-prompt-editor" style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-elevated)'
    }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          transition: 'color 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <Settings size={13} />
        <span style={{ fontWeight: 500 }}>System Prompt & Model</span>
        <span style={{
          marginLeft: 8,
          fontSize: 11,
          color: 'var(--text-muted)',
          flex: 1,
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {!open && prompt.slice(0, 60) + (prompt.length > 60 ? '…' : '')}
        </span>
        {/*<span style={{
          fontSize: 11,
          color: 'var(--accent)',
          background: 'var(--accent-glow)',
          padding: '2px 8px',
          borderRadius: 20,
          fontWeight: 500
        }}>
          {selectedProvider}/{selectedModel}
        </span>*/}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      
      {/* Editor panel */}
      {open && (
        <div style={{ padding: '0 16px 16px', animation: 'fadeIn 0.2s ease' }}>
          {/* Model selection */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Provider
              </label>
              <select
                value={selectedProvider}
                onChange={e => {
                  setSelectedProvider(e.target.value);
                  const providerModels = models[e.target.value] || [];
                  setSelectedModel(providerModels[0] || '');
                }}
                style={selectStyle}
              >
                {Object.keys(models).map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            {/*<div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Model
              </label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                style={selectStyle}
              >
                {(models[selectedProvider] || []).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div> */}
          </div> 

          {/* Prompt presets */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Wand2 size={11} /> Presets
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* System prompt textarea */}
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={4}
            placeholder="Write your system prompt here... Define the AI's personality, expertise, and behavior."
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.5,
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.15s'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-dim)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => setOpen(false)}
              style={ghostBtn}
            >
              Cancel
            </button>
            <button onClick={handleSave} style={{
              padding: '7px 16px',
              background: saved ? 'var(--success)' : 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.2s'
            }}>
              {saved ? <><Check size={13} /> Saved!</> : 'Apply Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  width: '100%',
  padding: '7px 10px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: 12,
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  cursor: 'pointer'
};

const ghostBtn = {
  padding: '7px 14px',
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-secondary)',
  fontSize: 12,
  fontFamily: 'var(--font-sans)',
  cursor: 'pointer'
};
