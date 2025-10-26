/**
 * Documents Management Page
 * 
 * Comprehensive document management interface for the RAG system.
 */

import { useState } from "react";
import { FileText, Database } from "lucide-react";
import { DocumentManager } from "../components/DocumentManager";

export default function DocumentsPage() {
  const [scope, setScope] = useState<"global" | "chat">("global");
  const [chatId] = useState<string>("demo-chat");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-bold text-white">Document Management</h1>
          </div>
          <p className="text-gray-300">
            Upload, manage, and organize documents for your RAG chatbot
          </p>
        </div>

        {/* Scope Selector */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <Database className="w-5 h-5 text-indigo-400" />
            <span className="text-white font-medium">Collection Scope:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setScope("global")}
                className={`px-4 py-2 rounded-lg transition ${
                  scope === "global"
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                🌐 Global Memory
              </button>
              <button
                onClick={() => setScope("chat")}
                className={`px-4 py-2 rounded-lg transition ${
                  scope === "chat"
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                💬 Chat Memory
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2 ml-9">
            {scope === "global"
              ? "Documents uploaded to global memory are accessible across all chats"
              : "Documents uploaded to chat memory are only accessible within this specific chat"}
          </p>
        </div>

        {/* Document Manager Component */}
        <DocumentManager
          scope={scope}
          chatId={scope === "chat" ? chatId : undefined}
          onDocumentChange={() => {
            console.log("Documents changed - refresh if needed");
          }}
        />

        {/* Help Section */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">📚 How to Use</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• <strong>Upload:</strong> Drag & drop files or click "Browse Files" to upload documents</p>
            <p>• <strong>Supported Formats:</strong> PDF, TXT, MD, DOCX, HTML</p>
            <p>• <strong>Search:</strong> Use the search bar to find documents by name</p>
            <p>• <strong>Filter:</strong> Filter documents by file type</p>
            <p>• <strong>Preview:</strong> Click the eye icon to preview document content</p>
            <p>• <strong>Debug:</strong> Click the chevron icon to view chunks and metadata</p>
            <p>• <strong>Delete:</strong> Select documents and use bulk delete, or delete individually</p>
            <p>• <strong>Scope:</strong> Choose global memory (shared) or chat memory (isolated)</p>
          </div>
        </div>

        {/* Features Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">🚀 Smart Chunking</h4>
            <p className="text-sm text-gray-400">
              Documents are automatically split into semantic chunks for optimal retrieval
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">🔍 Vector Search</h4>
            <p className="text-sm text-gray-400">
              All documents are embedded and indexed for semantic search with hybrid retrieval
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">💾 Persistent Storage</h4>
            <p className="text-sm text-gray-400">
              Documents are stored in ChromaDB with automatic persistence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
