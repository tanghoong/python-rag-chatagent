import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { MessageSquare, Trash2, Search, Plus } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";
import { ChatListSkeleton } from "./SkeletonLoader";
import { API_ENDPOINTS } from "../config";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface ChatSidebarProps {
  activeChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onChatListRefresh?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

function EmptyState({ searchQuery }: Readonly<{ searchQuery: string }>) {
  if (searchQuery) {
    return (
      <div className="text-center text-gray-500 py-8 px-4 text-sm">
        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No chats found</p>
      </div>
    );
  }
  
  return (
    <div className="text-center text-gray-500 py-8 px-4 text-sm">
      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p>No conversations yet</p>
      <p className="text-xs mt-1 opacity-75">Start chatting to see your history</p>
    </div>
  );
}

export function ChatSidebar({ 
  activeChatId, 
  onChatSelect, 
  onNewChat, 
  onChatListRefresh,
  isOpen: controlledIsOpen,
  onToggle 
}: Readonly<ChatSidebarProps>) {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const isChatPage = location.pathname === "/chat";

  // Load chat sessions
  useEffect(() => {
    if (isChatPage) {
      loadChats();
    }
  }, [isChatPage]);

  // Refresh when activeChatId changes (to update title)
  useEffect(() => {
    if (activeChatId && isChatPage) {
      loadChats();
    }
  }, [activeChatId]);

  // Listen for search toggle event
  useEffect(() => {
    const handleToggleSearch = () => {
      searchInputRef.current?.focus();
    };

    window.addEventListener('toggle-search', handleToggleSearch);
    return () => {
      window.removeEventListener('toggle-search', handleToggleSearch);
    };
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.chats);
      
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;

    try {
      const response = await fetch(API_ENDPOINTS.chatById(chatToDelete), {
        method: "DELETE",
      });

      if (response.ok) {
        setChats(chats.filter((chat) => chat.id !== chatToDelete));
        
        // If deleted chat was active, start new chat
        if (activeChatId === chatToDelete) {
          onNewChat();
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    } finally {
      setDeleteModalOpen(false);
      setChatToDelete(null);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    loadChats(); // Refresh list
  };

  // Don't render on home page
  if (!isChatPage) {
    return null;
  }

  return (
    <>
      {/* Sidebar with enhanced responsive design */}
      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-56 bg-black/40 backdrop-blur-xl transition-transform duration-300 z-40 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Header with New Chat */}
        <div className="p-3 space-y-2.5">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-linear-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-lg transition-all font-medium text-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-500 transition-colors"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-hover px-1.5 pb-3">
          {loading && <ChatListSkeleton />}
          
          {!loading && filteredChats.length === 0 && (
            <EmptyState searchQuery={searchQuery} />
          )}
          
          {!loading && filteredChats.length > 0 && (
            <div className="space-y-0.5">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={`w-full group relative px-2.5 py-2 rounded-lg cursor-pointer transition-all text-left ${
                    activeChatId === chat.id
                      ? "bg-white/15"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {chat.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {chat.message_count} {chat.message_count === 1 ? 'msg' : 'msgs'}
                      </p>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-md shrink-0"
                      title="Delete chat"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <button
          onClick={handleToggle}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 top-14"
          aria-label="Close sidebar"
          type="button"
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Chat"
        message="Are you sure you want to delete this chat? All messages will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteChat}
        onCancel={() => {
          setDeleteModalOpen(false);
          setChatToDelete(null);
        }}
        danger
      />
    </>
  );
}
