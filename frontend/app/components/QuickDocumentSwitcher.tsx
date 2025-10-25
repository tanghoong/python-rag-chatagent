/**
 * Quick Document Switcher Component
 * 
 * Quick access document switcher with keyboard shortcut (Ctrl+K)
 * Shows recently used documents and search
 */

import { useState, useEffect, useRef } from "react";
import { FileText, Clock, Search } from "lucide-react";
import { API_BASE_URL } from "../config";

interface Document {
  collection_name: string;
  document_count: number;
  last_used?: number;
}

interface QuickDocumentSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (documentName: string) => void;
  currentDocuments: string[];
}

export function QuickDocumentSwitcher({
  isOpen,
  onClose,
  onSelect,
  currentDocuments,
}: Readonly<QuickDocumentSwitcherProps>) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
      setSearchQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredDocuments.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filteredDocuments[selectedIndex]) {
        e.preventDefault();
        handleSelect(filteredDocuments[selectedIndex].collection_name);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/memory/stats/both`);
      const data = await response.json();

      if (data.status === "success") {
        const docs = Object.entries(data.stats.scopes).map(([name, stats]: [string, any]) => ({
          collection_name: name,
          document_count: stats.document_count,
          last_used: getLastUsedTimestamp(name),
        }));
        
        // Sort by recently used
        docs.sort((a, b) => (b.last_used || 0) - (a.last_used || 0));
        setDocuments(docs);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLastUsedTimestamp = (documentName: string): number => {
    const key = `doc_last_used_${documentName}`;
    const timestamp = localStorage.getItem(key);
    return timestamp ? parseInt(timestamp, 10) : 0;
  };

  const updateLastUsed = (documentName: string) => {
    const key = `doc_last_used_${documentName}`;
    localStorage.setItem(key, Date.now().toString());
  };

  const handleSelect = (documentName: string) => {
    updateLastUsed(documentName);
    onSelect(documentName);
    onClose();
  };

  const getDisplayName = (collectionName: string) => {
    if (collectionName === "global_memory") return "🌐 Global Memory";
    return collectionName.replace("chat_", "💬 ");
  };

  const isActive = (documentName: string) => currentDocuments.includes(documentName);

  const filteredDocuments = documents.filter(doc =>
    doc.collection_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentDocuments = documents
    .filter(doc => doc.last_used && doc.last_used > 0)
    .slice(0, 5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search documents... (use ↑↓ to navigate, Enter to select, Esc to close)"
              className="w-full pl-10 pr-4 py-3 text-lg border-0 focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Document List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* Search Results or All Documents */}
              {searchQuery ? (
                <div className="p-2">
                  {filteredDocuments.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      No documents found
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredDocuments.map((doc, index) => (
                        <button
                          key={doc.collection_name}
                          onClick={() => handleSelect(doc.collection_name)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                            index === selectedIndex
                              ? "bg-indigo-50 border-l-4 border-indigo-500"
                              : "hover:bg-gray-50 border-l-4 border-transparent"
                          }`}
                        >
                          <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                          <div className="flex-1 text-left">
                            <div className="font-medium text-gray-800">
                              {getDisplayName(doc.collection_name)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {doc.document_count} documents
                              {isActive(doc.collection_name) && (
                                <span className="ml-2 text-indigo-600 font-medium">• Active</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Recently Used */}
                  {recentDocuments.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 uppercase font-medium">
                        <Clock className="w-3 h-3" />
                        <span>Recently Used</span>
                      </div>
                      <div className="space-y-1">
                        {recentDocuments.map((doc, index) => (
                          <button
                            key={doc.collection_name}
                            onClick={() => handleSelect(doc.collection_name)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                              index === selectedIndex
                                ? "bg-indigo-50 border-l-4 border-indigo-500"
                                : "hover:bg-gray-50 border-l-4 border-transparent"
                            }`}
                          >
                            <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-800">
                                {getDisplayName(doc.collection_name)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {doc.document_count} documents
                                {isActive(doc.collection_name) && (
                                  <span className="ml-2 text-indigo-600 font-medium">• Active</span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Documents */}
                  {documents.length > 0 && (
                    <div className="p-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500 uppercase font-medium mb-2">
                        All Documents
                      </div>
                      <div className="space-y-1">
                        {documents.map((doc, index) => {
                          const adjustedIndex = recentDocuments.length + index;
                          return (
                            <button
                              key={doc.collection_name}
                              onClick={() => handleSelect(doc.collection_name)}
                              onMouseEnter={() => setSelectedIndex(adjustedIndex)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                                adjustedIndex === selectedIndex
                                  ? "bg-indigo-50 border-l-4 border-indigo-500"
                                  : "hover:bg-gray-50 border-l-4 border-transparent"
                              }`}
                            >
                              <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                              <div className="flex-1 text-left">
                                <div className="font-medium text-gray-800">
                                  {getDisplayName(doc.collection_name)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {doc.document_count} documents
                                  {isActive(doc.collection_name) && (
                                    <span className="ml-2 text-indigo-600 font-medium">• Active</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
          <span>
            Use <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">↑↓</kbd> to navigate,{" "}
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">Enter</kbd> to select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
