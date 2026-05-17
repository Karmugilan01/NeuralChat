// src/utils/api.js

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://neuralchat-a1f6.onrender.com";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  // Handle non-JSON errors safely
  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const text = await response.text();
      if (text) errorMessage = text;
    } catch {}
    throw new Error(errorMessage);
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

/* -----------------------------
   Conversations
----------------------------- */

export async function getConversations() {
  return request("/api/conversations");
}

export async function getConversation(sessionId) {
  return request(`/api/conversations/${sessionId}`);
}

export async function createConversation(data = {}) {
  return request("/api/conversations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateConversation(sessionId, data) {
  return request(`/api/conversations/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteConversation(sessionId) {
  return request(`/api/conversations/${sessionId}`, {
    method: "DELETE",
  });
}

export async function clearConversationMessages(sessionId) {
  return request(`/api/conversations/${sessionId}/messages`, {
    method: "DELETE",
  });
}

/* -----------------------------
   Models
----------------------------- */

export async function getModels() {
  return request("/api/models");
}

/* -----------------------------
   Streaming Chat (SSE)
----------------------------- */

export async function streamChat({
  sessionId,
  message,
  onChunk,
  onDone,
  onError,
}) {
  try {
    // ✅ FIXED: was incorrectly pointing to /api/chat
    // The server route is: POST /api/conversations/:sessionId/stream
    const response = await fetch(
      `${API_BASE}/api/conversations/${sessionId}/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // ✅ FIXED: sessionId goes in the URL, not the body
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop();

      for (const part of parts) {
        if (!part.startsWith("data:")) continue;
        const json = part.replace("data:", "").trim();
        if (!json) continue;

        try {
          const parsed = JSON.parse(json);

          if (parsed.type === "chunk") {
            onChunk?.(parsed.text || "");
          }
          if (parsed.type === "done") {
            onDone?.(parsed);
          }
          if (parsed.type === "error") {
            onError?.(parsed.message || "Unknown error");
          }
        } catch (err) {
          console.error("SSE Parse Error:", err);
        }
      }
    }
  } catch (error) {
    console.error(error);
    onError?.(error.message);
  }
}
