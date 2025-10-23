import { useEffect, useRef } from "react";
import type { Route } from "./+types/chat";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { ChatSidebar } from "../components/ChatSidebar";
import { useChatSession } from "../hooks/useChatSession";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chat - RAG Chatbot" },
    { name: "description", content: "Chat with our AI assistant" },
  ];
}

export default function Chat() {
  const {
    activeChatId,
    messages,
    loading,
    sendMessage,
    createNewChat,
    switchChat,
    startNewChat,
    editMessage,
    regenerateMessage,
    deleteMessage,
  } = useChatSession();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sidebarRefreshRef = useRef<(() => void) | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-focus input after bot responds
  useEffect(() => {
    if (!loading && messages.length > 0) {
      inputRef.current?.focus();
    }
  }, [loading]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
    // Trigger sidebar refresh to update chat title
    sidebarRefreshRef.current?.();
  };

  const handleNewChat = () => {
    startNewChat();
  };

  const handleChatSelect = (chatId: string) => {
    switchChat(chatId);
  };

  return (
    <div className="relative min-h-screen flex">
      <AnimatedBackground />

      {/* Chat Sidebar */}
      <ChatSidebar
        activeChatId={activeChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
      />

      {/* Main Chat Area */}
      <div className="relative z-10 flex-1 flex flex-col md:ml-64 h-screen">
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-3 py-4">
          {/* Header - Compact */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold gradient-text mb-1">Chat with AI</h1>
            <p className="text-sm text-gray-400">Ask me anything in rhyme</p>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="text-lg mb-2">No messages yet</p>
                  <p className="text-sm">Start a conversation by typing a message below</p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <ChatMessage 
                key={message.id || index}
                role={message.role === "assistant" ? "bot" : message.role} 
                content={message.content}
                messageId={message.id}
                chatId={activeChatId || undefined}
                onEdit={editMessage}
                onRegenerate={regenerateMessage}
                onDelete={deleteMessage}
              />
            ))}

            {loading && <LoadingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Input - Sticky */}
          <div className="mt-auto pt-2 pb-2 bg-gradient-to-t from-black/50 to-transparent">
            <ChatInput onSend={handleSendMessage} disabled={loading} inputRef={inputRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
