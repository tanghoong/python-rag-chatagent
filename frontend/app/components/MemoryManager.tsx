/**
 * Memory Manager Component
 * 
 * Provides CRUD interface for managing RAG memories from the frontend.
 * Features:
 * - View all memories (global and chat-specific)
 * - Search and filter memories
 * - Delete specific memories
 * - View memory statistics
 * - Export/import memories
 * - Upload documents
 * - Visual timeline
 */

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import { DocumentUpload } from "./DocumentUpload";
import { MemoryTimeline } from "./MemoryTimeline";

interface Memory {
  content: string;
  metadata: Record<string, any>;
  relevance_score?: number;
  source: string;
  source_indicator: string;
}

interface MemoryStats {
  scopes: Record<string, {
    collection_name: string;
    document_count: number;
    persist_directory: string;
    embedding_provider: string;
  }>;
  status: string;
}

export default function MemoryManager() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedScope, setSelectedScope] = useState<"global" | "chat" | "both">("both");
  const [chatId, setChatId] = useState<string>("");
  const [useGlobal, setUseGlobal] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "upload" | "timeline">("search");

  // Load memory stats on mount
  useEffect(() => {
    loadStats();
  }, [selectedScope, chatId, useGlobal]);

  const loadStats = async () => {
    try {
      const url = new URL(`${API_BASE_URL}/api/memory/stats/${selectedScope}`);
      if (chatId) url.searchParams.append("chat_id", chatId);
      url.searchParams.append("use_global", String(useGlobal));

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === "success") {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const searchMemories = async () => {
    if (!searchQuery.trim()) {
      setMessage({ type: "error", text: "Please enter a search query" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("query", searchQuery);
      formData.append("scope", selectedScope);
      formData.append("num_results", "20");
      formData.append("use_global", String(useGlobal));
      if (chatId) formData.append("chat_id", chatId);

      const response = await fetch(`${API_BASE_URL}/api/memory/search`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status === "success") {
        setMemories(data.results);
        setMessage({ type: "success", text: `Found ${data.results.length} memories` });
      } else {
        setMessage({ type: "error", text: "Search failed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (collectionName: string) => {
    if (!confirm(`Are you sure you want to delete collection "${collectionName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/memory/${collectionName}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.status === "success") {
        setMessage({ type: "success", text: data.message });
        loadStats();
        setMemories([]);
      } else {
        setMessage({ type: "error", text: "Failed to delete collection" });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${error}` });
    }
  };

  const exportMemories = () => {
    const dataStr = JSON.stringify(memories, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `memories-${selectedScope}-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ type: "success", text: "Memories exported successfully" });
  };

  const exportAsCSV = () => {
    const headers = ["Content", "Source", "Relevance Score", "Metadata"];
    const rows = memories.map(m => [
      `"${m.content.replace(/"/g, '""')}"`,
      m.source,
      m.relevance_score?.toFixed(3) || "N/A",
      JSON.stringify(m.metadata)
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `memories-${selectedScope}-${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ type: "success", text: "Memories exported as CSV" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🧠 Memory Manager</h1>
          <p className="text-gray-600">Manage and explore your RAG chatbot's memories</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("search")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "search"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              🔍 Search Memories
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "upload"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              📁 Upload Documents
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "timeline"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              📊 Timeline
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {message.text}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Scope Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Memory Scope
              </label>
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="global">🌐 Global Memory</option>
                <option value="chat">💬 Chat Memory</option>
                <option value="both">🔄 Both</option>
              </select>
            </div>

            {/* Chat ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chat ID (optional)
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Enter chat ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Global Memory Toggle */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGlobal}
                  onChange={(e) => setUseGlobal(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Enable Global Memory
                </span>
              </label>
            </div>

            {/* Refresh Stats Button */}
            <div className="flex items-end">
              <button
                onClick={loadStats}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                🔄 Refresh Stats
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchMemories()}
              placeholder="Search memories..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={searchMemories}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
            >
              {loading ? "Searching..." : "🔍 Search"}
            </button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(stats.scopes).map(([scopeName, scopeStats]) => (
              <div key={scopeName} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {scopeName === "global_memory" ? "🌐 Global" : `💬 ${scopeName}`}
                  </h3>
                  <button
                    onClick={() => deleteCollection(scopeStats.collection_name)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    🗑️ Delete
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Documents:</span> {scopeStats.document_count}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Provider:</span> {scopeStats.embedding_provider}
                  </p>
                  <p className="text-gray-600 text-xs break-all">
                    <span className="font-medium">Path:</span> {scopeStats.persist_directory}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Memory Results */}
        {activeTab === "search" && memories.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Search Results ({memories.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={exportMemories}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  📥 Export JSON
                </button>
                <button
                  onClick={exportAsCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  📊 Export CSV
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {memories.map((memory, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-indigo-600">
                      {memory.source_indicator}
                    </span>
                    {memory.relevance_score !== undefined && (
                      <span className="text-sm text-gray-500">
                        Relevance: {(memory.relevance_score * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 mb-3">{memory.content}</p>
                  {Object.keys(memory.metadata).length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        📋 Metadata
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(memory.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeTab === "search" && memories.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No memories found</h3>
            <p className="text-gray-600">Enter a search query to find relevant memories</p>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="max-w-3xl mx-auto">
            <DocumentUpload
              chatId={chatId}
              scope={selectedScope === "both" ? "global" : selectedScope}
              onUploadComplete={() => {
                setMessage({ type: "success", text: "Document uploaded successfully" });
                loadStats();
              }}
            />
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="max-w-4xl mx-auto">
            <MemoryTimeline
              chatId={chatId}
              scope={selectedScope}
            />
          </div>
        )}
      </div>
    </div>
  );
}
