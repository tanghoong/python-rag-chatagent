import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { MessageSquare, Trash2, Search, Plus, Pin, Edit2, Star, Tag, CheckSquare } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";
import { ChatListSkeleton } from "./SkeletonLoader";
import { TagEditor } from "./TagEditor";
import { ChatFilters, type ChatFilterOptions } from "./ChatFilters";
import { BulkActions } from "./BulkActions";
import { API_ENDPOINTS } from "../config";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  is_pinned: boolean;
  is_starred: boolean;
  tags: string[];
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
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editingTagsChatId, setEditingTagsChatId] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<ChatFilterOptions>({
    showPinned: false,
    showStarred: false,
    selectedTags: [],
    dateRange: "all",
  });
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const isChatPage = location.pathname === "/chat";

  // Load chat sessions
  useEffect(() => {
    if (isChatPage) {
      loadChats();
      loadAvailableTags();
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

  // Filter chats based on search query and filters
  const filteredChats = chats.filter((chat) => {
    // Search query filter
    if (!chat.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Pinned filter
    if (filters.showPinned && !chat.is_pinned) {
      return false;
    }

    // Starred filter
    if (filters.showStarred && !chat.is_starred) {
      return false;
    }

    // Tag filter
    if (filters.selectedTags.length > 0) {
      const chatTags = chat.tags || [];
      const hasMatchingTag = filters.selectedTags.some(tag => chatTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const chatDate = new Date(chat.updated_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (filters.dateRange) {
        case "today":
          if (daysDiff > 0) return false;
          break;
        case "week":
          if (daysDiff > 7) return false;
          break;
        case "month":
          if (daysDiff > 30) return false;
          break;
      }
    }

    return true;
  });

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

  const handleEditTitle = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
    // Focus input after render
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleSaveTitle = async (chatId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!editTitle.trim() || editTitle === chats.find(c => c.id === chatId)?.title) {
      setEditingChatId(null);
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.chatById(chatId)}/title`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      if (response.ok) {
        setChats(chats.map(chat => 
          chat.id === chatId ? { ...chat, title: editTitle.trim() } : chat
        ));
        setEditingChatId(null);
      }
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(null);
    setEditTitle("");
  };

  const handleTogglePin = async (chatId: string, currentPinStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await fetch(`${API_ENDPOINTS.chatById(chatId)}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !currentPinStatus }),
      });

      if (response.ok) {
        // Update local state and re-sort
        const updatedChats = chats.map(chat =>
          chat.id === chatId ? { ...chat, is_pinned: !currentPinStatus } : chat
        );
        // Sort: pinned first, then by updated_at
        updatedChats.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
        setChats(updatedChats);
      }
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleToggleStar = async (chatId: string, currentStarStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await fetch(`${API_ENDPOINTS.chatById(chatId)}/star`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: !currentStarStatus }),
      });

      if (response.ok) {
        // Update local state
        setChats(chats.map(chat =>
          chat.id === chatId ? { ...chat, is_starred: !currentStarStatus } : chat
        ));
      }
    } catch (error) {
      console.error("Failed to toggle star:", error);
    }
  };

  const loadAvailableTags = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.chatTags);
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags);
      }
    } catch (error) {
      console.error("Failed to load available tags:", error);
    }
  };

  const handleOpenTagEditor = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTagsChatId(chatId);
    loadAvailableTags();
  };

  const handleSaveTags = async (chatId: string, tags: string[]) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.chatById(chatId)}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });

      if (response.ok) {
        // Update local state
        setChats(chats.map(chat =>
          chat.id === chatId ? { ...chat, tags } : chat
        ));
        setEditingTagsChatId(null);
        // Refresh available tags
        loadAvailableTags();
      }
    } catch (error) {
      console.error("Failed to update tags:", error);
      throw error;
    }
  };

  // Bulk operations
  const handleToggleBulkMode = () => {
    setBulkSelectMode(!bulkSelectMode);
    setSelectedChatIds(new Set());
  };

  const handleToggleSelectChat = (chatId: string) => {
    const newSelected = new Set(selectedChatIds);
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedChatIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedChatIds.size === filteredChats.length) {
      setSelectedChatIds(new Set());
    } else {
      setSelectedChatIds(new Set(filteredChats.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedChatIds.size === 0) return;

    try {
      // Delete all selected chats
      await Promise.all(
        Array.from(selectedChatIds).map(chatId =>
          fetch(API_ENDPOINTS.chatById(chatId), { method: "DELETE" })
        )
      );

      // Update local state
      setChats(chats.filter(chat => !selectedChatIds.has(chat.id)));
      
      // If active chat was deleted, start new chat
      if (activeChatId && selectedChatIds.has(activeChatId)) {
        onNewChat();
      }

      // Exit bulk mode
      setBulkSelectMode(false);
      setSelectedChatIds(new Set());
    } catch (error) {
      console.error("Failed to bulk delete chats:", error);
    }
  };

  const handleBulkTag = async (tags: string[]) => {
    if (selectedChatIds.size === 0) return;

    try {
      // Update tags for all selected chats
      await Promise.all(
        Array.from(selectedChatIds).map(chatId =>
          fetch(`${API_ENDPOINTS.chatById(chatId)}/tags`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tags }),
          })
        )
      );

      // Update local state
      setChats(chats.map(chat =>
        selectedChatIds.has(chat.id) ? { ...chat, tags } : chat
      ));

      // Refresh available tags
      loadAvailableTags();
    } catch (error) {
      console.error("Failed to bulk update tags:", error);
      throw error;
    }
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-lg transition-all font-medium text-sm shadow-lg"
          >
            <Plus className="w-4 h-4" />
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

          {/* Filters - Collapsible */}
          <ChatFilters
            availableTags={availableTags}
            filters={filters}
            onFiltersChange={setFilters}
          />
          
          {/* Bulk select mode trigger - only show when there are chats */}
          {filteredChats.length > 0 && (
            <button
              onClick={handleToggleBulkMode}
              className={`w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg transition-all text-xs ${
                bulkSelectMode
                  ? "bg-purple-500 text-white"
                  : "bg-white/5 hover:bg-white/10 text-gray-400"
              }`}
              title="Bulk select mode"
              type="button"
            >
              <CheckSquare className="w-3 h-3" />
              <span>{bulkSelectMode ? 'Exit Bulk Mode' : 'Bulk Select'}</span>
            </button>
          )}
        </div>

        {/* Bulk Actions */}
        {bulkSelectMode && (
          <BulkActions
            selectedCount={selectedChatIds.size}
            totalCount={filteredChats.length}
            availableTags={availableTags}
            onSelectAll={handleSelectAll}
            onBulkDelete={handleBulkDelete}
            onBulkTag={handleBulkTag}
            onCancel={handleToggleBulkMode}
          />
        )}

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
                  onClick={() => {
                    if (bulkSelectMode) {
                      handleToggleSelectChat(chat.id);
                    } else if (editingChatId !== chat.id) {
                      onChatSelect(chat.id);
                    }
                  }}
                  className={`w-full group relative px-2.5 py-2 rounded-lg cursor-pointer transition-all text-left ${
                    bulkSelectMode && selectedChatIds.has(chat.id)
                      ? "bg-purple-500/20 border border-purple-500/30"
                      : activeChatId === chat.id
                      ? "bg-white/15"
                      : "hover:bg-white/5"
                  } ${chat.is_pinned && !bulkSelectMode ? "border-l-2 border-purple-400" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {/* Checkbox in bulk mode */}
                    {bulkSelectMode ? (
                      <input
                        type="checkbox"
                        checked={selectedChatIds.has(chat.id)}
                        onChange={() => handleToggleSelectChat(chat.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 mt-0.5 accent-purple-500 cursor-pointer shrink-0"
                      />
                    ) : chat.is_pinned ? (
                      <Pin className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" fill="currentColor" />
                    ) : null}
                    
                    <div className="flex-1 min-w-0">
                      {editingChatId === chat.id ? (
                        // Edit mode
                        <form 
                          className="space-y-1.5" 
                          onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSaveTitle(chat.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Edit chat title"
                        >
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveTitle(chat.id);
                              if (e.key === "Escape") handleCancelEdit(e as unknown as React.MouseEvent);
                            }}
                            className="w-full px-2 py-1 text-sm bg-white/10 rounded border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white"
                            maxLength={200}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => handleSaveTitle(chat.id, e)}
                              className="flex-1 px-2 py-1 text-xs bg-purple-500 hover:bg-purple-600 rounded transition-colors"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="flex-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        // View mode
                        <>
                          <h3 className="text-sm font-medium text-white truncate">
                            {chat.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-xs text-gray-400">
                              {chat.message_count} {chat.message_count === 1 ? 'msg' : 'msgs'}
                            </p>
                            {/* Tag chips */}
                            {chat.tags && chat.tags.length > 0 && (
                              <>
                                <span className="text-gray-500">•</span>
                                <div className="flex flex-wrap gap-1">
                                  {chat.tags.slice(0, 2).map(tag => (
                                    <span
                                      key={tag}
                                      className="inline-block px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] border border-purple-500/30"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {chat.tags.length > 2 && (
                                    <span className="text-[10px] text-gray-400">
                                      +{chat.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Action buttons - hide in bulk select mode */}
                    {!bulkSelectMode && editingChatId !== chat.id && editingTagsChatId !== chat.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {/* Edit button */}
                        <button
                          onClick={(e) => handleEditTitle(chat.id, chat.title, e)}
                          className="p-1.5 hover:bg-blue-500/20 rounded-md"
                          title="Edit title"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                        
                        {/* Star button */}
                        <button
                          onClick={(e) => handleToggleStar(chat.id, chat.is_starred, e)}
                          className="p-1.5 hover:bg-yellow-500/20 rounded-md"
                          title={chat.is_starred ? "Unstar chat" : "Star chat"}
                        >
                          <Star 
                            className={`w-3.5 h-3.5 ${chat.is_starred ? 'text-yellow-400' : 'text-gray-400'}`}
                            fill={chat.is_starred ? "currentColor" : "none"}
                          />
                        </button>
                        
                        {/* Tag button */}
                        <button
                          onClick={(e) => handleOpenTagEditor(chat.id, e)}
                          className="p-1.5 hover:bg-cyan-500/20 rounded-md"
                          title="Manage tags"
                        >
                          <Tag className={`w-3.5 h-3.5 ${chat.tags && chat.tags.length > 0 ? 'text-cyan-400' : 'text-gray-400'}`} />
                        </button>
                        
                        {/* Pin button */}
                        <button
                          onClick={(e) => handleTogglePin(chat.id, chat.is_pinned, e)}
                          className="p-1.5 hover:bg-purple-500/20 rounded-md"
                          title={chat.is_pinned ? "Unpin chat" : "Pin chat"}
                        >
                          <Pin 
                            className={`w-3.5 h-3.5 ${chat.is_pinned ? 'text-purple-400' : 'text-gray-400'}`}
                            fill={chat.is_pinned ? "currentColor" : "none"}
                          />
                        </button>
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className="p-1.5 hover:bg-red-500/20 rounded-md"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tag Editor */}
                  {editingTagsChatId === chat.id && (
                    <div className="mt-2">
                      <TagEditor
                        tags={chat.tags || []}
                        availableTags={availableTags}
                        onSave={(tags) => handleSaveTags(chat.id, tags)}
                        onCancel={() => setEditingTagsChatId(null)}
                      />
                    </div>
                  )}
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
