import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "./useLocalStorage";
import { useMessageStatus } from "./useMessageStatus";
import { fetchWithRetry } from "../utils/fetchWithRetry";
import { API_ENDPOINTS } from "../config";

interface ThoughtStep {
  step: string;
  content: string;
}

interface LLMMetadata {
  auto_switched: boolean;
  model: string;
  provider: string;
  complexity: string;
  complexity_score?: number;
  indicators?: string[];
  word_count?: number;
}

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  thought_process?: ThoughtStep[];
  llm_metadata?: LLMMetadata;
  retrieval_context?: {
    chunks: Array<{
      content: string;
      relevance_score: number;
      source: string;
      metadata?: Record<string, any>;
      chunk_id?: string;
    }>;
    search_queries: string[];
    search_strategies: string[];
    total_searches: number;
    unique_sources: string[];
    total_chunks: number;
    timestamp?: string;
  };
  metadata?: {
    llm_metadata?: LLMMetadata;
    thought_process?: ThoughtStep[];
    retrieval_context?: any;
    [key: string]: unknown;
  };
  created_at?: string;
  timestamp?: string;
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
  const [processingState, setProcessingState] = useState<'thinking' | 'searching' | 'generating' | 'processing' | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Add message status tracking
  const { 
    updateMessageStatus, 
    getMessageStatus: getStatusForMessage, 
    simulateMessageProgression 
  } = useMessageStatus();

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
      const response = await fetchWithRetry(API_ENDPOINTS.chatById(chatId), {
        method: "GET",
      }, {
        maxRetries: 2,
        onRetry: (attempt) => console.log(`Retrying load chat session (attempt ${attempt})`)
      });

      if (response.ok) {
        const data: ChatDetail = await response.json();
        // Extract llm_metadata and retrieval_context from message metadata if available
        const messagesWithMetadata = data.messages.map(msg => ({
          ...msg,
          llm_metadata: msg.metadata?.llm_metadata,
          retrieval_context: msg.metadata?.retrieval_context,
        }));
        setMessages(messagesWithMetadata);
      } else {
        console.error("Failed to load chat session");
        toast.error("Failed to load chat session");
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading chat session:", error);
      toast.error("Error loading chat");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Create a new chat session
  const createNewChat = useCallback(async () => {
    try {
      const response = await fetchWithRetry(API_ENDPOINTS.chats, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "New Chat",
        }),
      }, {
        maxRetries: 2,
        onRetry: (attempt) => console.log(`Retrying create chat (attempt ${attempt})`)
      });

      if (response.ok) {
        const data = await response.json();
        setActiveChatId(data.chat_id);
        setMessages([]);
        toast.success("New chat created");
        return data.chat_id;
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create new chat");
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

  // Send a message to the current chat with streaming
  const sendMessage = async (message: string) => {
    if (!message.trim()) return null;

    try {
      setLoading(true);
      setProcessingState('thinking');
      const controller = new AbortController();
      setAbortController(controller);

      // Generate unique message ID for tracking
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // Add user message optimistically with timestamp and ID
      const userMessage: Message = {
        id: messageId,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Start message status progression
      simulateMessageProgression(messageId);

      // Use streaming endpoint
      const response = await fetch(API_ENDPOINTS.chatStream, {
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

      if (!response.ok) {
        throw new Error("Streaming failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentChatId = activeChatId;
      let accumulatedContent = "";
      let currentThoughtProcess: ThoughtStep[] = [];
      let currentLlmMetadata: LLMMetadata | undefined = undefined;
      let currentRetrievalContext: any = undefined;
      let streamingMessageIndex = -1;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data.trim()) {
                try {
                  const event = JSON.parse(data);

                  switch (event.type) {
                    case "chat_id":
                      if (event.chat_id) {
                        currentChatId = event.chat_id;
                        setActiveChatId(event.chat_id);
                      }
                      break;

                    case "title":
                      // Title updated
                      break;

                    case "llm_metadata":
                      if (event.metadata) {
                        currentLlmMetadata = event.metadata;
                      }
                      break;

                    case "retrieval_context":
                      if (event.context) {
                        currentRetrievalContext = event.context;
                        setProcessingState('searching');
                      }
                      break;

                    case "thought_process":
                      if (event.steps) {
                        currentThoughtProcess = event.steps;
                        setProcessingState('thinking');
                      }
                      break;

                    case "token":
                      // Switch to generating state when we start receiving tokens
                      if (event.content && processingState !== 'generating') {
                        setProcessingState('generating');
                      }
                      
                      if (event.content) {
                        accumulatedContent += event.content;
                        
                        // Add or update streaming message
                        if (streamingMessageIndex === -1) {
                          const tempMessage: Message = {
                            role: "assistant",
                            content: accumulatedContent,
                            thought_process: currentThoughtProcess,
                            llm_metadata: currentLlmMetadata,
                          };
                          setMessages((prev) => [...prev, tempMessage]);
                          streamingMessageIndex = messages.length + 1;
                        } else {
                          setMessages((prev) => {
                            const updated = [...prev];
                            updated[updated.length - 1] = {
                              role: "assistant",
                              content: accumulatedContent,
                              thought_process: currentThoughtProcess,
                              llm_metadata: currentLlmMetadata,
                              retrieval_context: currentRetrievalContext,
                            };
                            return updated;
                          });
                        }
                      }
                      break;

                    case "done":
                      // Final update with complete message
                      setProcessingState(null);
                      if (streamingMessageIndex !== -1) {
                        setMessages((prev) => {
                          const updated = [...prev];
                          updated[updated.length - 1] = {
                            role: "assistant",
                            content: accumulatedContent,
                            thought_process: currentThoughtProcess,
                            llm_metadata: currentLlmMetadata,
                            retrieval_context: currentRetrievalContext,
                          };
                          return updated;
                        });
                      }
                      break;

                    case "error":
                      console.error("Streaming error:", event.error);
                      setMessages((prev) => prev.slice(0, -1)); // Remove user message
                      break;
                  }
                } catch (e) {
                  console.error("Error parsing SSE data:", e);
                }
              }
            }
          }
        }
      }

      return { chat_id: currentChatId };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Message cancelled by user");
        toast.info("Message cancelled");
      } else {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
      }
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
      return null;
    } finally {
      setAbortController(null);
      setLoading(false);
      setProcessingState(null);
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
      const response = await fetchWithRetry(
        `http://localhost:8000/api/chats/${activeChatId}/messages/${messageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newContent }),
        },
        {
          maxRetries: 2,
          onRetry: (attempt) => console.log(`Retrying edit message (attempt ${attempt})`)
        }
      );

      if (response.ok) {
        // Reload the chat session to get updated messages
        await loadChatSession(activeChatId);
        toast.success("Message updated");
        
        // If this is the last user message, regenerate the assistant response
        if (shouldRegenerate) {
          await regenerateMessage(messageId);
        }
      } else {
        throw new Error("Failed to edit message");
      }
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Failed to edit message");
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
      const response = await fetchWithRetry(
        API_ENDPOINTS.regenerate(activeChatId, messageId),
        {
          method: "POST",
        },
        {
          maxRetries: 2,
          onRetry: (attempt) => console.log(`Retrying regenerate message (attempt ${attempt})`)
        }
      );

      if (response.ok) {
        // Reload the chat session to get updated messages
        await loadChatSession(activeChatId);
        toast.success("Response regenerated");
      } else {
        throw new Error("Failed to regenerate message");
      }
    } catch (error) {
      console.error("Error regenerating message:", error);
      toast.error("Failed to regenerate message");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    if (!activeChatId) return;

    try {
      const response = await fetchWithRetry(
        `http://localhost:8000/api/chats/${activeChatId}/messages/${messageId}`,
        {
          method: "DELETE",
        },
        {
          maxRetries: 2,
          onRetry: (attempt) => console.log(`Retrying delete message (attempt ${attempt})`)
        }
      );

      if (response.ok) {
        // Reload the chat session to get updated messages
        await loadChatSession(activeChatId);
        toast.success("Message deleted");
      } else {
        throw new Error("Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
      throw error;
    }
  };

  return {
    activeChatId,
    messages,
    loading,
    processingState,
    sendMessage,
    cancelMessage,
    createNewChat,
    switchChat,
    startNewChat,
    loadChatSession,
    editMessage,
    regenerateMessage,
    deleteMessage,
    // Message status tracking
    getMessageStatus: getStatusForMessage,
  };
}
