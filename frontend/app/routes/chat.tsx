import { useState, useEffect, useRef } from "react";
import type { Route } from "./+types/chat";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import { LoadingIndicator } from "../components/LoadingIndicator";

interface Message {
  role: "user" | "bot";
  content: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chat - RAG Chatbot" },
    { name: "description", content: "Chat with our AI assistant" },
  ];
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Call backend API
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add bot response
      const botMessage: Message = {
        role: "bot",
        content: data.response || "I apologize, but I couldn't generate a response.",
      };
      setMessages((prev) => [...prev, botMessage]);

      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to connect to the server. Please make sure the backend is running.");
      
      // Add error message as bot response
      const errorMessage: Message = {
        role: "bot",
        content: "I'm sorry, but I couldn't reach the server,\nAn error occurred, which is quite the deserter.\nPlease check the backend is running fine,\nAnd try again, everything will align!",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />

      <div className="relative z-10 flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Chat with AI</h1>
          <p className="text-gray-400">Ask me anything, and I'll respond in rhyme!</p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No messages yet</p>
                <p className="text-sm">Start a conversation by typing a message below</p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <ChatMessage key={index} role={message.role} content={message.content} />
          ))}

          {isLoading && <LoadingIndicator />}

          {/* Error display */}
          {error && (
            <div className="glass-card bg-red-500/10 border-red-500/30">
              <p className="text-red-400 text-sm">⚠️ {error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 pt-4">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
