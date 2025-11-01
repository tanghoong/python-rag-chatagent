/**
 * Memory Manager Component
 * 
 * Provides CRUD interface for managing RAG memories from the frontend.
 * Features:
 * - View all memories (global and chat-specific)
 * - Create, edit, delete memories
 * - Search and filter memories
 * - Bulk operations
 * - Tag-based filtering
 * - Upload documents
 * - Visual timeline
 */

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useMemoryCRUD } from "../hooks/useMemoryCRUD";
import type { Memory } from "../hooks/useMemoryCRUD";
import { MemoryEditor } from "./MemoryEditor";
import { MemoryList } from "./MemoryList";
import { DocumentUpload } from "./DocumentUpload";
import { MemoryTimeline } from "./MemoryTimeline";

export default function MemoryManager() {
  const [activeTab, setActiveTab] = useState<"browse" | "upload" | "timeline">("browse");
  const [collection, setCollection] = useState("global_memory");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [currentTag, setCurrentTag] = useState<string | null>(null);
  const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);

  const {
    loading,
    createMemory,
    listMemories,
    updateMemory,
    deleteMemory,
    bulkDeleteMemories,
  } = useMemoryCRUD(collection);

  // Load memories when page, collection, or tag changes
  useEffect(() => {
    loadMemories();
  }, [currentPage, collection, currentTag]);

  const loadMemories = async () => {
    const offset = (currentPage - 1) * pageSize;
    const result = await listMemories(pageSize, offset, currentTag || undefined);
    
    if (result) {
      setMemories(result.memories);
      setTotal(result.total);
    }
  };

  const handleCreateClick = () => {
    setEditingMemory(null);
    setShowEditor(true);
  };

  const handleEditClick = (memory: Memory) => {
    setEditingMemory(memory);
    setShowEditor(true);
  };

  const handleSave = async (data: { content: string; tags: string[]; metadata: Record<string, any> }) => {
    if (editingMemory) {
      // Update existing memory
      const updated = await updateMemory(editingMemory.memory_id, {
        content: data.content,
        tags: data.tags,
        metadata: data.metadata,
      });
      
      if (updated) {
        setShowEditor(false);
        setEditingMemory(null);
        loadMemories();
      }
    } else {
      // Create new memory
      const created = await createMemory({
        content: data.content,
        tags: data.tags,
        metadata: data.metadata,
      });
      
      if (created) {
        setShowEditor(false);
        loadMemories();
      }
    }
  };

  const handleDelete = async (memoryId: string) => {
    if (!memoryId) {
      // Bulk delete
      if (selectedMemories.length === 0) {
        toast.error("No memories selected");
        return;
      }

      if (!confirm(`Delete ${selectedMemories.length} memories? This cannot be undone.`)) {
        return;
      }

      const deleted = await bulkDeleteMemories(selectedMemories);
      if (deleted > 0) {
        setSelectedMemories([]);
        loadMemories();
      }
    } else {
      // Single delete
      if (!confirm("Delete this memory? This cannot be undone.")) {
        return;
      }

      const success = await deleteMemory(memoryId);
      if (success) {
        setSelectedMemories(selectedMemories.filter(id => id !== memoryId));
        loadMemories();
      }
    }
  };

  const handleToggleSelect = (memoryId: string) => {
    setSelectedMemories(prev =>
      prev.includes(memoryId)
        ? prev.filter(id => id !== memoryId)
        : [...prev, memoryId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedMemories(memories.map(m => m.memory_id));
    } else {
      setSelectedMemories([]);
    }
  };

  const handleFilterByTag = (tag: string | null) => {
    setCurrentTag(tag);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedMemories([]);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      if (format === 'json') {
        // Export as JSON
        const exportData = {
          collection,
          exported_at: new Date().toISOString(),
          total: memories.length,
          memories: memories.map(m => ({
            content: m.content,
            tags: m.tags || [],
            metadata: m.metadata,
            created_at: m.created_at,
          })),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memories_${collection}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Memories exported as JSON');
      } else {
        // Export as CSV
        const headers = ['Content', 'Tags', 'Created At', 'Metadata'];
        const rows = memories.map(m => [
          `"${(m.content || '').replace(/"/g, '""')}"`,
          `"${(m.tags || []).join(', ')}"`,
          m.created_at || '',
          `"${JSON.stringify(m.metadata || {}).replace(/"/g, '""')}"`,
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memories_${collection}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Memories exported as CSV');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export memories');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      let importedMemories: any[] = [];

      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        importedMemories = Array.isArray(data) ? data : (data.memories || []);
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV parsing
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',');
          importedMemories.push({
            content: values[0]?.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
            tags: values[1]?.replace(/^"|"$/g, '').split(',').map(t => t.trim()).filter(Boolean) || [],
            metadata: values[3] ? JSON.parse(values[3].replace(/^"|"$/g, '').replace(/""/g, '"')) : {},
          });
        }
      }

      // Import memories
      let successCount = 0;
      for (const memData of importedMemories) {
        if (!memData.content) continue;
        
        const created = await createMemory({
          content: memData.content,
          tags: memData.tags || [],
          metadata: memData.metadata || {},
        });
        
        if (created) successCount++;
      }

      if (successCount > 0) {
        toast.success(`Imported ${successCount} memories successfully`);
        loadMemories();
      } else {
        toast.warning('No memories were imported');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import memories');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            🧠 Memory Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and explore your RAG chatbot's memories
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("browse")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "browse"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
            >
              📖 Browse & Edit
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "upload"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
            >
              📁 Upload Documents
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "timeline"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
            >
              📊 Timeline
            </button>
          </div>
        </div>

        {/* Browse Tab */}
        {activeTab === "browse" && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Collection
                  </label>
                  <select
                    value={collection}
                    onChange={(e) => {
                      setCollection(e.target.value);
                      setCurrentPage(1);
                      setSelectedMemories([]);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                  >
                    <option value="global_memory">🌐 Global Memory</option>
                    <option value="chat_memory">💬 Chat Memory</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateClick}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create Memory
                  </button>
                  
                  {/* Export/Import Dropdown */}
                  <div className="relative group">
                    <button
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 font-medium"
                    >
                      📥 Export/Import
                    </button>
                    <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                      <button
                        onClick={() => handleExport('json')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg"
                      >
                        📄 Export as JSON
                      </button>
                      <button
                        onClick={() => handleExport('csv')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        📊 Export as CSV
                      </button>
                      <label className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-b-lg cursor-pointer block">
                        📁 Import File
                        <input
                          type="file"
                          accept=".json,.csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImport(file);
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor */}
            {showEditor && (
              <MemoryEditor
                memory={editingMemory}
                collection={collection}
                onSave={handleSave}
                onCancel={() => {
                  setShowEditor(false);
                  setEditingMemory(null);
                }}
                isLoading={loading}
              />
            )}

            {/* Memory List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Memories ({total})
              </h2>
              <MemoryList
                memories={memories}
                total={total}
                currentPage={currentPage}
                pageSize={pageSize}
                isLoading={loading}
                selectedMemories={selectedMemories}
                onPageChange={handlePageChange}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onFilterByTag={handleFilterByTag}
                currentTag={currentTag}
              />
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="max-w-3xl mx-auto">
            <DocumentUpload
              chatId=""
              scope="global"
              onUploadComplete={() => {
                toast.success("Document uploaded successfully");
                loadMemories();
              }}
            />
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="max-w-4xl mx-auto">
            <MemoryTimeline
              chatId=""
              scope="global"
            />
          </div>
        )}
      </div>
    </div>
  );
}
