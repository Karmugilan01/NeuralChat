// src/hooks/useChat.js

import { useState, useCallback, useRef } from 'react';
import {
  getConversations,
  getConversation,
  createConversation as apiCreateConversation,
  updateConversation as apiUpdateConversation,
  deleteConversation as apiDeleteConversation,
  clearConversationMessages,
  streamChat,
} from '../utils/api.js';

export function useChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  const loadConversations = useCallback(async () => {
    try {
      const list = await getConversations();
      setConversations(list);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const selectConversation = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);
    try {
      const conv = await getConversation(sessionId);
      setActiveConversation(conv);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (options = {}) => {
    try {
      const conv = await apiCreateConversation(options);
      setConversations(prev => [conv, ...prev]);
      setActiveConversation(conv);
      return conv;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const deleteConversation = useCallback(async (sessionId) => {
    await apiDeleteConversation(sessionId);
    setConversations(prev => prev.filter(c => c.sessionId !== sessionId));
    if (activeConversation?.sessionId === sessionId) {
      setActiveConversation(null);
    }
  }, [activeConversation]);

  const sendMessage = useCallback(async (text) => {
    if (!activeConversation || isStreaming || !text.trim()) return;

    const userMessage = { role: 'user', content: text, timestamp: new Date() };

    setActiveConversation(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    setIsStreaming(true);
    setStreamingText('');
    setError(null);
    abortRef.current = false;

    let accumulated = '';

    await streamChat({
      sessionId: activeConversation.sessionId,
      message: text,
      onChunk: (chunk) => {
        if (abortRef.current) return;
        accumulated += chunk;
        setStreamingText(accumulated);
      },
      onDone: ({ title }) => {
        const assistantMessage = {
          role: 'assistant',
          content: accumulated,
          timestamp: new Date(),
        };

        setActiveConversation(prev => ({
          ...prev,
          title,
          messages: [...prev.messages, assistantMessage],
        }));

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
      },
    });
  }, [activeConversation, isStreaming]);

  const updateConversation = useCallback(async (updates) => {
    if (!activeConversation) return;
    try {
      const updated = await apiUpdateConversation(activeConversation.sessionId, updates);
      setActiveConversation(updated);
      setConversations(prev =>
        prev.map(c => c.sessionId === updated.sessionId ? { ...c, ...updates } : c)
      );
    } catch (err) {
      setError(err.message);
    }
  }, [activeConversation]);

  const clearMessages = useCallback(async () => {
    if (!activeConversation) return;
    try {
      const updated = await clearConversationMessages(activeConversation.sessionId);
      setActiveConversation(updated);
      setConversations(prev =>
        prev.map(c =>
          c.sessionId === updated.sessionId
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
    setError,
  };
}
