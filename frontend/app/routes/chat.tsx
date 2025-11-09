import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/chat";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Activity, Sparkles, Grid3x3 } from "lucide-react";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import { ChatSidebar } from "../components/ChatSidebar";
import { ShortcutsHelp } from "../components/ShortcutsHelp";
import { ReminderSidebar } from "../components/ReminderSidebar";
import { TypingIndicator } from "../components/TypingIndicator";
import { StreamingProgressIndicator } from "../components/StreamingProgressIndicator";
import { TokenUsageVisualization } from "../components/TokenUsageVisualization";
import { QuickTemplates } from "../components/QuickTemplates";
import { PromptTemplates } from "../components/PromptTemplates";
import { PersonaSelector } from "../components/PersonaSelector";
import { PersonaEditor } from "../components/PersonaEditor";
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
    processingState,
    sendMessage,
    cancelMessage,
    switchChat,
    startNewChat,
    editMessage,
    regenerateMessage,
    deleteMessage,
    getMessageStatus: getMessageStatusFromHook,
  } = useChatSession();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRefreshRef = useRef<(() => void) | null>(null);
  const reminderSidebarRefreshRef = useRef<(() => void) | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reminderSidebarOpen, setReminderSidebarOpen] = useState(false); // Hidden by default for cleaner UI
  const [showTokenUsage, setShowTokenUsage] = useState(false);
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{ prompt_text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showPersonaEditor, setShowPersonaEditor] = useState(false);
  const [currentPersonaId, setCurrentPersonaId] = useState<string | undefined>(undefined);

  // Improved scroll to bottom function with retry mechanism
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (container) {
      // Use scrollTo for more reliable scrolling
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
      
      // For smooth scrolling, verify we actually scrolled and retry if needed
      if (behavior === "smooth") {
        setTimeout(() => {
          const { scrollTop, scrollHeight, clientHeight } = container;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
          
          // If still not at bottom after smooth scroll, try again with instant
          if (distanceFromBottom > 10) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: "instant"
            });
          }
        }, 500); // Wait for smooth scroll to complete
      }
    }
  };

  // Detect if user has scrolled up with improved logic
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

  // Track whether we're close to the bottom
  const atBottom = distanceFromBottom <= 80;
  setIsAtBottom(atBottom);

      // Clear any existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Track if user is actively scrolling with debouncing
      if (distanceFromBottom > 30) {
        setIsUserScrolling(true);
        // Auto-reset scrolling state after 3 seconds of no scroll
        scrollTimeout = setTimeout(() => {
          setIsUserScrolling(false);
        }, 3000);
      } else {
        setIsUserScrolling(false);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive with improved timing
  useEffect(() => {
    if (!isUserScrolling && messages.length > 0) {
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
    }
  }, [messages, loading, isUserScrolling]);

  // Auto-scroll to bottom when switching chats - improved timing and reliability
  useEffect(() => {
    if (activeChatId) {
      setIsUserScrolling(false); // Reset scroll tracking on chat switch
      
      // Wait for DOM updates and code block rendering with multiple check points
      const scrollTimer = setTimeout(() => {
        scrollToBottom("instant");
        
        // Double-check scroll position after a short delay
        setTimeout(() => {
          const container = messagesContainerRef.current;
          if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            
            // If still not at bottom, scroll again
            if (distanceFromBottom > 10) {
              scrollToBottom("smooth");
            }
          }
          
          // Focus input after scrolling completes
          inputRef.current?.focus();
        }, 150);
      }, 200);

      return () => clearTimeout(scrollTimer);
    }
  }, [activeChatId]);

  // Auto-focus input after bot responds
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      
      // Check if the last message contains reminder operations and trigger refresh
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant') {
        const reminderKeywords = [
          'Reminder created successfully',
          'Reminder updated successfully',
          'Reminder deleted successfully',
          'Reminder completed successfully',
          'Reminder snoozed successfully'
        ];
        
        const containsReminderOp = reminderKeywords.some(keyword => 
          lastMessage.content.includes(keyword)
        );
        
        if (containsReminderOp && reminderSidebarRefreshRef.current) {
          // Small delay to ensure backend operation is complete
          setTimeout(() => {
            reminderSidebarRefreshRef.current?.();
          }, 500);
        }
      }
    }
  }, [loading, messages]);

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

  // Handle template selection from empty state
  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate({ prompt_text: template.prompt_text });
    // Clear the selection after a short delay to reset the state
    setTimeout(() => setSelectedTemplate(null), 1000);
    toast.success(`Applied template: ${template.title}`);
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

  // Helper function to format date separators
  const formatDateSeparator = (date: string | undefined) => {
    if (!date) return null;
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to compare dates only
    const resetTime = (d: Date) => {
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const messageDateOnly = resetTime(new Date(messageDate));
    const todayOnly = resetTime(new Date(today));
    const yesterdayOnly = resetTime(new Date(yesterday));

    if (messageDateOnly.getTime() === todayOnly.getTime()) {
      return "Today";
    } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: messageDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // Check if date separator should be shown
  const shouldShowDateSeparator = (currentIndex: number) => {
    if (currentIndex === 0) return true;
    
    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];
    
    if (!currentMessage?.created_at || !previousMessage?.created_at) return false;
    
    const currentDate = new Date(currentMessage.created_at).toDateString();
    const previousDate = new Date(previousMessage.created_at).toDateString();
    
    return currentDate !== previousDate;
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
          globalThis.dispatchEvent(new CustomEvent('toggle-search'));
        },
        description: "Search chats",
      },
      {
        key: "n",
        ctrlKey: true,
        handler: () => {
          handleNewChat();
        },
        description: "New chat",
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
      {
        key: "r",
        ctrlKey: true,
        shiftKey: true,
        handler: () => {
          setReminderSidebarOpen((prev) => !prev);
        },
        description: "Toggle reminder sidebar",
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

      {/* Left Sidebar - Chat History */}
      <ChatSidebar
        activeChatId={activeChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area - Center Column with enhanced responsive design */}
      <div className={`relative z-10 flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        sidebarOpen ? 'md:ml-56 lg:ml-56' : 'md:ml-0 lg:ml-0'
      } ${
        reminderSidebarOpen ? 'xl:mr-80' : 'xl:mr-0'
      }`}>
        <div className="flex-1 flex flex-col w-full overflow-hidden">
          {/* Chat Header with Persona Selector */}
          {activeChatId && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm">
              <PersonaSelector
                activeChatId={activeChatId}
                currentPersonaId={currentPersonaId}
                onPersonaChange={(personaId) => setCurrentPersonaId(personaId)}
                onCreatePersona={() => setShowPersonaEditor(true)}
              />
            </div>
          )}

          {/* Messages Container with responsive spacing */}
          <div 
            ref={messagesContainerRef}
            className="relative flex-1 overflow-y-auto scrollbar-hover space-y-1 sm:space-y-2 px-1 xs:px-2 sm:px-4 lg:px-6 py-1 sm:py-2 pb-20 xs:pb-24 sm:pb-28 min-h-0 scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full px-4">
                {/* Simplified Welcome Header */}
                <div className="text-center max-w-2xl">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">How can I help you today?</h2>
                  <p className="text-gray-400 text-base sm:text-lg mb-8">Start a conversation by typing your message below</p>
                  
                  {/* Simple feature hints */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-purple-400">💬</span>
                      <span>Natural conversation</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-blue-400">🎤</span>
                      <span>Voice input available</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-green-400">✨</span>
                      <span>Smart AI responses</span>
                    </div>
                  </div>
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
              const showDateSeparator = shouldShowDateSeparator(index);

              // Enhanced message status for user messages with tracking
              const getMessageStatus = () => {
                if (message.role !== "user") return undefined;
                
                // Use enhanced status tracking if message has ID
                if (message.id && getMessageStatusFromHook) {
                  return getMessageStatusFromHook(message.id);
                }
                
                // Fallback to simple logic for messages without ID
                if (loading && isLastUserMessage) return 'sending';
                return 'delivered';
              };

              return (
                <div key={message.id || index}>
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4 sm:my-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5">
                        <span className="text-xs sm:text-sm text-white/60 font-medium">
                          {formatDateSeparator(message.created_at || message.timestamp)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <ChatMessage 
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
                    messageStatus={getMessageStatus()}
                    onEdit={editMessage}
                    onRegenerate={handleRegenerate}
                    onDelete={deleteMessage}
                    onRetrievalFeedback={async (chunkId, helpful) => {
                      try {
                        // Find the chunk data from the message
                        const chunk = message.retrieval_context?.chunks.find((c: any) => c.chunk_id === chunkId);
                        
                        if (!chunk) {
                          toast.error("Chunk not found");
                          return;
                        }

                        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api/retrieval/feedback`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            chunk_id: chunkId,
                            helpful: helpful,
                            source: chunk.source,
                            content: chunk.content,
                            relevance_score: chunk.relevance_score,
                            chat_id: activeChatId,
                            query: message.retrieval_context?.search_queries?.[0],
                            metadata: chunk.metadata
                          }),
                        });

                        if (!response.ok) {
                          throw new Error("Failed to record feedback");
                        }

                        const data = await response.json();
                        toast.success(data.message || `Feedback recorded: ${helpful ? 'helpful' : 'not helpful'}`);
                      } catch (error) {
                        console.error("Error recording feedback:", error);
                        toast.error("Failed to record feedback");
                      }
                    }}
                  />
                </div>
              );
            })}

            {/* Typing Indicator */}
            {loading && (
              <TypingIndicator 
                processingState={processingState}
                isVisible={loading}
              />
            )}

            {/* Streaming Progress Indicator */}
            {loading && (
              <StreamingProgressIndicator 
                isStreaming={loading}
                contentLength={messages.length > 0 ? messages.at(-1)?.content?.length || 0 : 0}
                processingState={processingState}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Token Usage Toggle Button */}
          {activeChatId && messages.length > 0 && (
            <button
              onClick={() => setShowTokenUsage(!showTokenUsage)}
              className={`fixed bottom-44 sm:bottom-52 z-40 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-105 ${
                showTokenUsage ? 'rotate-180' : ''
              } ${
                (() => {
                  if (sidebarOpen && reminderSidebarOpen) {
                    return 'right-84 lg:right-88';
                  } else if (reminderSidebarOpen) {
                    return 'right-72 lg:right-84';
                  } else {
                    return 'right-4 lg:right-6';
                  }
                })()
              }`}
              title={showTokenUsage ? 'Hide Token Usage' : 'Show Token Usage'}
            >
              <Activity className="w-4 h-4" />
            </button>
          )}

          {/* Fixed scroll toggle button - positioned at right edge, outside scrolling container */}
          {messages.length > 0 && (
            <button
              onClick={() => {
                const container = messagesContainerRef.current;
                if (!container) return;

                if (isAtBottom) {
                  // Scroll to top
                  container.scrollTo({ top: 0, behavior: 'smooth' });
                  // update state optimistically
                  setIsAtBottom(false);
                } else {
                  // Scroll to bottom
                  scrollToBottom('smooth');
                  setIsAtBottom(true);
                }
              }}
              className={`fixed bottom-32 sm:bottom-40 z-40 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg transition-transform duration-200 transform hover:scale-105 ${
                (() => {
                  if (sidebarOpen && reminderSidebarOpen) {
                    return 'right-84 lg:right-88';
                  } else if (reminderSidebarOpen) {
                    return 'right-72 lg:right-84';
                  } else {
                    return 'right-4 lg:right-6';
                  }
                })()
              }`}
              aria-label={isAtBottom ? 'Scroll to top' : 'Jump to latest message'}
            >
              {isAtBottom ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
            </button>
          )}

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
          <div className={`fixed bottom-0 left-0 right-0 z-20 px-2 xs:px-3 sm:px-6 lg:px-8 pb-2 xs:pb-3 sm:pb-4 pt-2 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-sm transition-all duration-300 ${
            sidebarOpen ? 'md:left-56 lg:left-56' : 'md:left-0 lg:left-0'
          } ${
            reminderSidebarOpen ? 'xl:right-80' : 'xl:right-0'
          }`}>
            <div className="w-full mx-auto">
              <ChatInput 
                onSend={handleSendMessage} 
                onCancel={cancelMessage}
                loading={loading}
                processingState={processingState}
                error={error}
                inputRef={inputRef}
                externalTemplate={selectedTemplate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Token Usage Panel - Floating */}
      {showTokenUsage && (
        <div className="fixed bottom-20 right-4 w-80 z-30 animate-slide-up">
          <TokenUsageVisualization 
            chatId={activeChatId}
            isVisible={showTokenUsage}
            className="shadow-xl"
          />
        </div>
      )}

      {/* Right Sidebar - Reminder System */}
      {reminderSidebarOpen && (
        <aside className="hidden lg:block fixed top-14 right-0 h-[calc(100vh-3.5rem)] w-80 bg-white border-l border-gray-200 z-20 shadow-xl animate-slide-in-right">
          <ReminderSidebar
            onCreateReminder={() => {
              // Navigate to reminders page or open create modal
              window.location.href = '/reminders';
            }}
            onEditReminder={(reminder) => {
              // Navigate to reminders page with edit mode
              window.location.href = `/reminders?edit=${reminder.id}`;
            }}
            isVisible={true}
            refreshRef={reminderSidebarRefreshRef}
          />
        </aside>
      )}

      {/* Prompt Templates Modal */}
      <PromptTemplates 
        isOpen={showPromptTemplates}
        onClose={() => setShowPromptTemplates(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* Persona Editor Modal */}
      <PersonaEditor
        isOpen={showPersonaEditor}
        onClose={() => setShowPersonaEditor(false)}
        onSave={() => {
          // Refresh persona list in PersonaSelector
          setShowPersonaEditor(false);
        }}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
