import { useState, useCallback, useRef } from 'react';
import { api } from '../utils/api.js';

export function useChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Select a conversation and load it fully
  const selectConversation = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);
    try {
      const conv = await api.getConversation(sessionId);
      setActiveConversation(conv);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new conversation
  const createConversation = useCallback(async (options = {}) => {
    try {
      const conv = await api.createConversation(options);
      setConversations(prev => [conv, ...prev]);
      setActiveConversation(conv);
      return conv;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (sessionId) => {
    await api.deleteConversation(sessionId);
    setConversations(prev => prev.filter(c => c.sessionId !== sessionId));
    if (activeConversation?.sessionId === sessionId) {
      setActiveConversation(null);
    }
  }, [activeConversation]);

  // Send a message with streaming
  const sendMessage = useCallback(async (text) => {
    if (!activeConversation || isStreaming || !text.trim()) return;

    const userMessage = { role: 'user', content: text, timestamp: new Date() };

    // Optimistically add user message
    setActiveConversation(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setIsStreaming(true);
    setStreamingText('');
    setError(null);
    abortRef.current = false;

    let accumulated = '';

    await api.streamMessage(activeConversation.sessionId, text, {
      onStart: ({ model, provider }) => {
        console.log(`Streaming from ${provider}/${model}`);
      },
      onChunk: (chunk) => {
        if (abortRef.current) return;
        accumulated += chunk;
        setStreamingText(accumulated);
      },
      onDone: async ({ title }) => {
        const assistantMessage = {
          role: 'assistant',
          content: accumulated,
          timestamp: new Date()
        };

        setActiveConversation(prev => ({
          ...prev,
          title,
          messages: [...prev.messages, assistantMessage]
        }));

        // Update title in sidebar
        setConversations(prev =>
          prev.map(c =>
            c.sessionId === activeConversation.sessionId
              ? { ...c, title, updatedAt: new Date() }
              : c
          )
        );

        setStreamingText('');
        setIsStreaming(false);
      },
      onError: (msg) => {
        setError(msg);
        setStreamingText('');
        setIsStreaming(false);
      }
    });
  }, [activeConversation, isStreaming]);

  // Update system prompt or model
  const updateConversation = useCallback(async (updates) => {
    if (!activeConversation) return;
    try {
      const updated = await api.updateConversation(activeConversation.sessionId, updates);
      setActiveConversation(updated);
      setConversations(prev =>
        prev.map(c => c.sessionId === updated.sessionId ? { ...c, ...updates } : c)
      );
    } catch (err) {
      setError(err.message);
    }
  }, [activeConversation]);

  // Clear messages
  const clearMessages = useCallback(async () => {
    if (!activeConversation) return;
    try {
      const updated = await api.clearMessages(activeConversation.sessionId);
      setActiveConversation(updated);
      setConversations(prev =>
        prev.map(c => c.sessionId === updated.sessionId
          ? { ...c, title: 'New Conversation' }
          : c
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }, [activeConversation]);

  return {
    conversations,
    activeConversation,
    isStreaming,
    streamingText,
    isLoading,
    error,
    loadConversations,
    selectConversation,
    createConversation,
    deleteConversation,
    sendMessage,
    updateConversation,
    clearMessages,
    setError
  };
}
