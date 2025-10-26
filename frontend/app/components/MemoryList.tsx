import { useState } from "react";
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Tag, Clock } from "lucide-react";
import type { Memory } from "../hooks/useMemoryCRUD";

interface MemoryListProps {
  readonly memories: Memory[];
  readonly total: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly isLoading: boolean;
  readonly selectedMemories: string[];
  readonly onPageChange: (page: number) => void;
  readonly onEdit: (memory: Memory) => void;
  readonly onDelete: (memoryId: string) => void;
  readonly onToggleSelect: (memoryId: string) => void;
  readonly onSelectAll: (selected: boolean) => void;
  readonly onFilterByTag: (tag: string | null) => void;
  readonly currentTag: string | null;
}

export function MemoryList({
  memories,
  total,
  currentPage,
  pageSize,
  isLoading,
  selectedMemories,
  onPageChange,
  onEdit,
  onDelete,
  onToggleSelect,
  onSelectAll,
  onFilterByTag,
  currentTag,
}: MemoryListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const totalPages = Math.ceil(total / pageSize);
  const allSelected = memories.length > 0 && selectedMemories.length === memories.length;

  const filteredMemories = memories.filter((memory) =>
    memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memory.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
          />
        </div>
        {currentTag && (
          <button
            onClick={() => onFilterByTag(null)}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-2"
          >
            <Tag className="w-4 h-4" />
            {currentTag}
            <span className="ml-2 text-blue-600 dark:text-blue-300">×</span>
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedMemories.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-800 dark:text-blue-200">
            {selectedMemories.length} selected
          </span>
          <button
            onClick={() => onDelete("")}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Memory List */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading memories...</p>
        </div>
      )}
      
      {!isLoading && filteredMemories.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? "No memories found matching your search" : "No memories yet"}
          </p>
        </div>
      )}
      
      {!isLoading && filteredMemories.length > 0 && (
        <div className="space-y-3">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Select All ({filteredMemories.length})
            </label>
          </div>

          {/* Memory Cards */}
          {filteredMemories.map((memory) => (
            <div
              key={memory.memory_id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow border transition-all ${
                selectedMemories.includes(memory.memory_id)
                  ? "border-blue-500 dark:border-blue-400"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedMemories.includes(memory.memory_id)}
                    onChange={() => onToggleSelect(memory.memory_id)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap wrap-break-word">
                      {truncateContent(memory.content)}
                    </p>

                    {/* Tags */}
                    {memory.tags && memory.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {memory.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => onFilterByTag(tag)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(memory.created_at)}
                      </span>
                      {memory.updated_at && memory.updated_at !== memory.created_at && (
                        <span className="flex items-center gap-1">
                          Updated: {formatDate(memory.updated_at)}
                        </span>
                      )}
                      <span className="font-mono text-xs">
                        {memory.memory_id.substring(0, 12)}...
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(memory)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Edit memory"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(memory.memory_id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages} ({total} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
