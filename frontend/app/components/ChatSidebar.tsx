import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { MessageSquare, Trash2 } from "lucide-react";
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

export function ChatSidebar({ 
  activeChatId, 
  onChatSelect, 
  onNewChat, 
  onChatListRefresh,
  isOpen: controlledIsOpen,
  onToggle 
}: Readonly<ChatSidebarProps>) {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
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
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 sm:w-56 glass-card transition-transform duration-300 z-50 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{ padding: 0, borderRadius: 0 }}
      >
        {/* Search Input */}
        <div className="p-3 pt-14 border-b border-white/10">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search chats (Ctrl + K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400"
          />
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-white/10">
          <button
            onClick={handleNewChat}
            className="w-full gradient-button flex items-center justify-center space-x-2 py-2 text-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {loading ? (
            <ChatListSkeleton />
          ) : filteredChats.length === 0 ? (
            <div className="text-center text-gray-400 py-6 text-xs">
              {searchQuery ? 'No chats found.' : 'No chats yet.'}<br />
              {!searchQuery && 'Start a new conversation!'}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`group relative p-2 rounded-md cursor-pointer transition-all ${
                  activeChatId === chat.id
                    ? "bg-white/20 border border-white/20"
                    : "bg-white/5 hover:bg-white/10 border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium text-white truncate">
                      {chat.title}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {chat.message_count} msgs
                    </p>
                  </div>
                  
                  {/* Delete button - show on hover */}
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-500/20 rounded"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={handleToggle}
          className="md:hidden fixed inset-0 bg-black/50 z-30"
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
