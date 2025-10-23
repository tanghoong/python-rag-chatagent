import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

interface ThoughtStep {
  step: string;
  content: string;
}

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  thought_process?: ThoughtStep[];
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface ChatDetail {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * Custom hook for managing chat sessions
 */
export function useChatSession() {
  const [activeChatId, setActiveChatId] = useLocalStorage<string | null>("activeChatId", null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Load chat session when activeChatId changes
  useEffect(() => {
    if (activeChatId) {
      loadChatSession(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  // Load full chat session with messages
  const loadChatSession = async (chatId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/chats/${chatId}`);

      if (response.ok) {
        const data: ChatDetail = await response.json();
        setMessages(data.messages);
      } else {
        console.error("Failed to load chat session");
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading chat session:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Create a new chat session
  const createNewChat = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "New Chat",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveChatId(data.chat_id);
        setMessages([]);
        return data.chat_id;
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
    return null;
  }, [setActiveChatId]);

  // Switch to a different chat
  const switchChat = useCallback(
    (chatId: string) => {
      setActiveChatId(chatId);
    },
    [setActiveChatId]
  );

  // Cancel ongoing message
  const cancelMessage = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
    }
  }, [abortController]);

  // Send a message to the current chat
  const sendMessage = async (message: string) => {
    if (!message.trim()) return null;

    try {
      setLoading(true);
      const controller = new AbortController();
      setAbortController(controller);

      // Add user message optimistically
      const userMessage: Message = {
        role: "user",
        content: message,
      };
      setMessages((prev) => [...prev, userMessage]);

      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          message,
          chat_id: activeChatId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update active chat ID if it's a new chat
        if (!activeChatId && data.chat_id) {
          setActiveChatId(data.chat_id);
        }

        // Add assistant message with thought process
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          thought_process: data.thought_process || [],
        };
        setMessages((prev) => [...prev, assistantMessage]);

        return data;
      } else {
        // Remove optimistic user message on error
        setMessages((prev) => prev.slice(0, -1));
        throw new Error("Failed to send message");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Message cancelled by user");
      } else {
        console.error("Error sending message:", error);
      }
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
      return null;
    } finally {
      setAbortController(null);
      setLoading(false);
    }
  };

  // Start a new chat (clear current)
  const startNewChat = useCallback(() => {
    setActiveChatId(null);
    setMessages([]);
  }, [setActiveChatId]);

  // Edit a message
  const editMessage = async (messageId: string, newContent: string, shouldRegenerate: boolean = false) => {
    if (!activeChatId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/chats/${activeChatId}/messages/${messageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newContent }),
        }
      );

      if (response.ok) {
        // Reload the chat session to get updated messages
        await loadChatSession(activeChatId);
        
        // If this is the last user message, regenerate the assistant response
        if (shouldRegenerate) {
          await regenerateMessage(messageId);
        }
      } else {
        throw new Error("Failed to edit message");
      }
    } catch (error) {
      console.error("Error editing message:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Regenerate a message
  const regenerateMessage = async (messageId: string) => {
    if (!activeChatId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/chats/${activeChatId}/regenerate/${messageId}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        // Reload the chat session to get updated messages
        await loadChatSession(activeChatId);
      } else {
        throw new Error("Failed to regenerate message");
      }
    } catch (error) {
      console.error("Error regenerating message:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    if (!activeChatId) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/chats/${activeChatId}/messages/${messageId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Reload the chat session to get updated messages
        await loadChatSession(activeChatId);
      } else {
        throw new Error("Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  };

  return {
    activeChatId,
    messages,
    loading,
    sendMessage,
    cancelMessage,
    createNewChat,
    switchChat,
    startNewChat,
    loadChatSession,
    editMessage,
    regenerateMessage,
    deleteMessage,
  };
}
