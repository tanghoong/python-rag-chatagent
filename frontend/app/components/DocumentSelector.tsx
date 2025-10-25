/**
 * Document Selector Component
 * 
 * Allows users to select which documents are active for the current chat.
 * Supports multi-document selection and displays active documents.
 */

import { useState, useEffect } from "react";
import { FileText, X, Search, Check } from "lucide-react";
import { API_BASE_URL } from "../config";

interface Document {
  collection_name: string;
  document_count: number;
  embedding_provider: string;
  persist_directory: string;
}

interface DocumentSelectorProps {
  chatId: string;
  onDocumentsChange?: (documents: string[]) => void;
  initialDocuments?: string[];
}

export function DocumentSelector({ 
  chatId, 
  onDocumentsChange,
  initialDocuments = []
}: Readonly<DocumentSelectorProps>) {
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>(initialDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    // Persist selected documents to localStorage
    const key = `chat_documents_${chatId}`;
    localStorage.setItem(key, JSON.stringify(selectedDocuments));
    onDocumentsChange?.(selectedDocuments);
  }, [selectedDocuments, chatId, onDocumentsChange]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/memory/stats/both`);
      const data = await response.json();

      if (data.status === "success") {
        const docs = Object.entries(data.stats.scopes).map(([name, stats]: [string, any]) => ({
          collection_name: name,
          document_count: stats.document_count,
          embedding_provider: stats.embedding_provider,
          persist_directory: stats.persist_directory,
        }));
        setAvailableDocuments(docs);

        // Load persisted selections
        const key = `chat_documents_${chatId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setSelectedDocuments(parsed);
          } catch (e) {
            console.error("Failed to parse saved documents:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDocument = (collectionName: string) => {
    setSelectedDocuments(prev => 
      prev.includes(collectionName)
        ? prev.filter(d => d !== collectionName)
        : [...prev, collectionName]
    );
  };

  const removeDocument = (collectionName: string) => {
    setSelectedDocuments(prev => prev.filter(d => d !== collectionName));
  };

  const clearAll = () => {
    setSelectedDocuments([]);
  };

  const filteredDocuments = availableDocuments.filter(doc =>
    doc.collection_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDisplayName = (collectionName: string) => {
    if (collectionName === "global_memory") return "🌐 Global Memory";
    return collectionName.replace("chat_", "💬 ");
  };

  return (
    <div className="relative">
      {/* Active Documents Display */}
      <div className="flex items-center gap-2 flex-wrap">
        {selectedDocuments.length === 0 ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
          >
            <FileText className="w-4 h-4" />
            <span>Select Documents</span>
          </button>
        ) : (
          <>
            {selectedDocuments.slice(0, 2).map(doc => (
              <div
                key={doc}
                className="flex items-center gap-1.5 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium"
              >
                <FileText className="w-3 h-3" />
                <span className="max-w-[120px] truncate">{getDisplayName(doc)}</span>
                <button
                  onClick={() => removeDocument(doc)}
                  className="hover:bg-indigo-200 rounded p-0.5 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {selectedDocuments.length > 2 && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-200 transition"
              >
                +{selectedDocuments.length - 2} more
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              title="Manage documents"
            >
              <FileText className="w-4 h-4 text-gray-600" />
            </button>
          </>
        )}
      </div>

      {/* Document Selector Modal */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Select Documents</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Document List */}
          <div className="max-h-64 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center p-8 text-gray-500 text-sm">
                No documents found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredDocuments.map(doc => {
                  const isSelected = selectedDocuments.includes(doc.collection_name);
                  return (
                    <button
                      key={doc.collection_name}
                      onClick={() => toggleDocument(doc.collection_name)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                        isSelected
                          ? "bg-indigo-50 border-2 border-indigo-500"
                          : "hover:bg-gray-50 border-2 border-transparent"
                      }`}
                    >
                      <div className={`flex items-center justify-center w-5 h-5 rounded border-2 ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600"
                          : "border-gray-300"
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm text-gray-800">
                          {getDisplayName(doc.collection_name)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {doc.document_count} documents
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedDocuments.length} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={clearAll}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
