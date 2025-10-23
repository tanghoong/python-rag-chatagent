import { useState, useCallback } from "react";
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

interface StreamEvent {
  type: "chat_id" | "title" | "thought_process" | "token" | "done" | "error";
  chat_id?: string;
  title?: string;
  steps?: ThoughtStep[];
  content?: string;
  error?: string;
}

/**
 * Custom hook for streaming chat responses
 */
export function useStreamingChat() {
  const [activeChatId, setActiveChatId] = useLocalStorage<string | null>("activeChatId", null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [thoughtProcess, setThoughtProcess] = useState<ThoughtStep[]>([]);

  // Send message with streaming
  const sendStreamingMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return null;

      try {
        setLoading(true);
        setStreamingMessage("");
        setThoughtProcess([]);

        // Add user message optimistically
        const userMessage: Message = {
          role: "user",
          content: message,
        };
        setMessages((prev) => [...prev, userMessage]);

        // Create EventSource for SSE
        const eventSource = new EventSource(
          `http://localhost:8000/api/chat/stream?${new URLSearchParams({
            message,
            chat_id: activeChatId || "",
          })}`
        );

        // Note: EventSource only supports GET, so we need to adjust the backend
        // OR use fetch with manual SSE parsing
        // Let's use fetch with manual SSE parsing instead

        const response = await fetch("http://localhost:8000/api/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
                    const event: StreamEvent = JSON.parse(data);

                    switch (event.type) {
                      case "chat_id":
                        if (event.chat_id) {
                          currentChatId = event.chat_id;
                          setActiveChatId(event.chat_id);
                        }
                        break;

                      case "title":
                        // Title updated, could refresh sidebar
                        break;

                      case "thought_process":
                        if (event.steps) {
                          currentThoughtProcess = event.steps;
                          setThoughtProcess(event.steps);
                        }
                        break;

                      case "token":
                        if (event.content) {
                          accumulatedContent += event.content;
                          setStreamingMessage(accumulatedContent);
                        }
                        break;

                      case "done":
                        // Add final assistant message
                        const assistantMessage: Message = {
                          role: "assistant",
                          content: accumulatedContent,
                          thought_process: currentThoughtProcess,
                        };
                        setMessages((prev) => [...prev, assistantMessage]);
                        setStreamingMessage("");
                        setThoughtProcess([]);
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
      } catch (error) {
        console.error("Error in streaming:", error);
        setMessages((prev) => prev.slice(0, -1)); // Remove user message
        return null;
      } finally {
        setLoading(false);
      }
    },
    [activeChatId, setActiveChatId]
  );

  return {
    activeChatId,
    messages,
    loading,
    streamingMessage,
    thoughtProcess,
    sendStreamingMessage,
    setMessages,
    setActiveChatId,
  };
}
