const API_BASE =
  'https://neuralchat-zx5u.onrender.com';

async function request(path, options = {}) {

  const response = await fetch(
    `${API_BASE}${path}`,
    {
      headers: {
        'Content-Type': 'application/json'
      },

      credentials: 'include',

      ...options
    }
  );

  if (!response.ok) {

    const error = await response.text();

    throw new Error(error);
  }

  return response.json();
}

export const getConversations = () =>
  request('/api/conversations');

export const getConversation = (id) =>
  request(`/api/conversations/${id}`);

export const createConversation = (data) =>
  request('/api/conversations', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const updateConversation = (id, data) =>
  request(`/api/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });

export const deleteConversation = (id) =>
  request(`/api/conversations/${id}`, {
    method: 'DELETE'
  });
