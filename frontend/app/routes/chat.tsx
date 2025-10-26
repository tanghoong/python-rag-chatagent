import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/chat";
import { toast } from "sonner";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import { ChatSidebar } from "../components/ChatSidebar";
import { ShortcutsHelp } from "../components/ShortcutsHelp";
import { useChatSession } from "../hooks/useChatSession";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

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
    cancelMessage,
    createNewChat,
    switchChat,
    startNewChat,
    editMessage,
    regenerateMessage,
    deleteMessage,
  } = useChatSession();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const sidebarRefreshRef = useRef<(() => void) | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    try {
      setError(null);
      await sendMessage(content);
      // Trigger sidebar refresh to update chat title
      sidebarRefreshRef.current?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleRegenerate = async (messageId: string) => {
    await regenerateMessage(messageId);
    // Reload the chat session to get the new response
    if (activeChatId) {
      // The regenerateMessage already handles reloading
    }
  };

  const handleNewChat = () => {
    startNewChat();
  };

  const handleChatSelect = (chatId: string) => {
    switchChat(chatId);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "Enter",
        ctrlKey: true,
        handler: () => {
          // Trigger form submit
          inputRef.current?.form?.requestSubmit();
        },
        description: "Send message",
      },
      {
        key: "k",
        ctrlKey: true,
        shiftKey: true,
        handler: () => {
          // Trigger search event for sidebar
          window.dispatchEvent(new CustomEvent('toggle-search'));
        },
        description: "Search chats",
      },
      {
        key: "O",
        ctrlKey: true,
        shiftKey: true,
        handler: () => {
          handleNewChat();
        },
        description: "Open new chat",
      },
      {
        key: "S",
        ctrlKey: true,
        shiftKey: true,
        handler: () => {
          setSidebarOpen((prev) => !prev);
        },
        description: "Toggle sidebar",
      },
      {
        key: ";",
        ctrlKey: true,
        shiftKey: true,
        handler: () => {
          // Find last code block and copy it
          const codeBlocks = document.querySelectorAll('pre code');
          if (codeBlocks.length > 0) {
            const lastCodeBlock = codeBlocks[codeBlocks.length - 1];
            navigator.clipboard.writeText(lastCodeBlock.textContent || '');
            toast.success('Code copied to clipboard');
          } else {
            toast.error('No code blocks found');
          }
        },
        description: "Copy last code block",
      },
      {
        key: "Backspace",
        ctrlKey: true,
        shiftKey: true,
        handler: () => {
          if (activeChatId) {
            // Trigger delete for current chat
            const deleteEvent = new CustomEvent('delete-active-chat');
            window.dispatchEvent(deleteEvent);
          }
        },
        description: "Delete chat",
      },
      {
        key: "Escape",
        shiftKey: true,
        handler: () => {
          inputRef.current?.focus();
        },
        description: "Focus chat input",
      },
      {
        key: "u",
        ctrlKey: true,
        handler: () => {
          fileInputRef.current?.click();
        },
        description: "Add photos & files",
      },
      {
        key: "Escape",
        handler: () => {
          if (loading) {
            // Cancel ongoing message
            cancelMessage();
          } else if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
          }
        },
        description: "Cancel / Clear input",
      },
      {
        key: "/",
        ctrlKey: true,
        handler: () => {
          setShowShortcuts((prev) => !prev);
        },
        description: "Show shortcuts",
      },
      {
        key: "I",
        ctrlKey: true,
        shiftKey: true,
        handler: () => {
          // Navigate to settings/instructions page
          window.location.href = '/settings';
        },
        description: "Set custom instructions",
      },
    ],
  });

  // Listen for toggle shortcuts event from Navbar
  useEffect(() => {
    const handleToggleShortcuts = () => {
      setShowShortcuts((prev) => !prev);
    };

    const handleSearchShortcut = () => {
      setShowSearch((prev) => !prev);
    };

    const handleToggleSidebar = () => {
      setSidebarOpen((prev) => {
        const newState = !prev;
        // Notify root about sidebar state change
        window.dispatchEvent(new CustomEvent('sidebar-state-changed', { detail: newState }));
        return newState;
      });
    };

    window.addEventListener('toggle-shortcuts', handleToggleShortcuts);
    window.addEventListener('toggle-search', handleSearchShortcut);
    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    
    return () => {
      window.removeEventListener('toggle-shortcuts', handleToggleShortcuts);
      window.removeEventListener('toggle-search', handleSearchShortcut);
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  }, []);

  // Emit initial sidebar state
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sidebar-state-changed', { detail: sidebarOpen }));
  }, [sidebarOpen]);

  return (
    <div className="relative h-screen flex overflow-hidden">
      <AnimatedBackground />

      {/* Chat Sidebar */}
      <ChatSidebar
        activeChatId={activeChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="relative z-10 flex-1 flex flex-col md:ml-64 overflow-hidden">
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full overflow-hidden">
          {/* Messages Container with bottom padding for fixed input */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 sm:space-y-3 px-2 sm:px-4 py-2 sm:py-4 pb-24 sm:pb-28 min-h-0">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full px-4">
                <div className="text-center text-gray-500">
                  <p className="text-base sm:text-lg mb-2">No messages yet</p>
                  <p className="text-xs sm:text-sm">Start a conversation by typing a message below</p>
                </div>
              </div>
            )}

            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              // Find last user message
              let lastUserMessageIndex = -1;
              for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role === "user") {
                  lastUserMessageIndex = i;
                  break;
                }
              }
              const isLastUserMessage = index === lastUserMessageIndex;

              return (
                <ChatMessage 
                  key={message.id || index}
                  role={message.role === "assistant" ? "bot" : message.role} 
                  content={message.content}
                  messageId={message.id}
                  chatId={activeChatId || undefined}
                  thoughtProcess={message.thought_process}
                  llmMetadata={message.llm_metadata}
                  retrievalContext={message.retrieval_context}
                  isLastMessage={isLastMessage}
                  isLastUserMessage={isLastUserMessage}
                  timestamp={message.created_at || message.timestamp}
                  onEdit={editMessage}
                  onRegenerate={handleRegenerate}
                  onDelete={deleteMessage}
                  onRetrievalFeedback={(chunkId, helpful) => {
                    console.log(`Chunk ${chunkId} marked as ${helpful ? 'helpful' : 'not helpful'}`);
                    // TODO: Implement feedback API call
                  }}
                />
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Hidden file input for Ctrl+U shortcut */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            multiple
            className="hidden"
            onChange={(e) => {
              // Handle file upload
              const files = Array.from(e.target.files || []);
              console.log('Files selected:', files);
              // TODO: Implement file upload logic
            }}
          />

          {/* Input - Fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 md:left-64 z-20 px-2 sm:px-4 pb-3 sm:pb-4 pt-2 bg-linear-to-t from-black/80 via-black/50 to-transparent backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              <ChatInput 
                onSend={handleSendMessage} 
                onCancel={cancelMessage}
                loading={loading}
                error={error}
                inputRef={inputRef} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
