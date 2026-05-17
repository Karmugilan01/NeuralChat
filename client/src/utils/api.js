const BASE = import.meta.env.VITE_API_URL + '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    let errorMessage = res.statusText || `HTTP ${res.status}`;

    if (contentType.includes('application/json')) {
      const body = await res.json().catch(() => null);
      if (body?.error) errorMessage = body.error;
      else if (body && typeof body === 'object') errorMessage = JSON.stringify(body);
    } else {
      const text = await res.text().catch(() => null);
      if (text) errorMessage = text;
    }

    throw new Error(errorMessage || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  getConversations: () => request('/conversations'),
  getConversation: (id) => request(`/conversations/${id}`),
  createConversation: (data) =>
    request('/conversations', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateConversation: (id, data) =>
    request(`/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteConversation: (id) =>
    request(`/conversations/${id}`, {
      method: 'DELETE'
    }),

  clearMessages: (id) =>
    request(`/conversations/${id}/messages`, {
      method: 'DELETE'
    }),

  getModels: () => request('/models'),

  health: () => request('/health'),

  streamMessage: async (
    sessionId,
    message,
    { onChunk, onDone, onError, onStart }
  ) => {
    const res = await fetch(
      `${BASE}/conversations/${sessionId}/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      }
    );

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: 'Stream failed' }));

      onError?.(err.error || 'Stream failed');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        try {
          const event = JSON.parse(line.slice(6));

          if (event.type === 'start') onStart?.(event);
          else if (event.type === 'chunk') onChunk?.(event.text);
          else if (event.type === 'done') onDone?.(event);
          else if (event.type === 'error')
            onError?.(event.message);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }
};
