/**
 * Document Manager Component
 * 
 * Comprehensive document management UI with:
 * - Drag & drop upload with progress bars
 * - Document list with metadata
 * - Search and filter functionality
 * - Document preview
 * - Delete with confirmation
 * - Bulk operations
 * - Chunks and embeddings debug view
 */

import { useState, useEffect } from "react";
import {
  Upload,
  File,
  FileText,
  Search,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Loader,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { API_BASE_URL } from "../config";
import { ConfirmModal } from "./ConfirmModal";

interface DocumentMetadata {
  filename: string;
  chunks: number;
  file_type: string;
  uploaded_at: string;
  total_chars: number;
  metadata: Record<string, any>;
}

interface UploadProgress {
  filename: string;
  status: "uploading" | "processing" | "success" | "error";
  progress: number;
  message?: string;
}

interface DocumentManagerProps {
  chatId?: string;
  scope?: "global" | "chat";
  onDocumentChange?: () => void;
}

export function DocumentManager({ chatId, scope = "global", onDocumentChange }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [showDebugView, setShowDebugView] = useState<string | null>(null);
  const [collectionStats, setCollectionStats] = useState<any>(null);

  const supportedFormats = [".pdf", ".txt", ".md", ".docx", ".html", ".htm"];
  const collectionName = scope === "chat" && chatId ? `chat_${chatId}` : "global_memory";

  useEffect(() => {
    loadDocuments();
  }, [collectionName]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/list?collection_name=${collectionName}&limit=100`
      );
      const data = await response.json();

      if (data.status === "success") {
        setDocuments(data.documents || []);
        setCollectionStats(data.collection_stats);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    // Add upload progress
    setUploads(prev => [...prev, {
      filename: file.name,
      status: "uploading",
      progress: 0
    }]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("collection_name", collectionName);
    if (chatId && scope === "chat") {
      formData.append("chat_id", chatId);
    }

    try {
      // Simulate progress (in real app, use XMLHttpRequest for actual progress)
      const progressInterval = setInterval(() => {
        setUploads(prev => prev.map(u =>
          u.filename === file.name && u.progress < 90
            ? { ...u, progress: u.progress + 10 }
            : u
        ));
      }, 200);

      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (data.status === "success") {
        setUploads(prev => prev.map(u =>
          u.filename === file.name
            ? { ...u, status: "success", progress: 100, message: data.message }
            : u
        ));
        
        // Reload documents after short delay
        setTimeout(() => {
          loadDocuments();
          onDocumentChange?.();
        }, 1000);
      } else {
        setUploads(prev => prev.map(u =>
          u.filename === file.name
            ? { ...u, status: "error", progress: 0, message: data.message || "Upload failed" }
            : u
        ));
      }
    } catch (error) {
      setUploads(prev => prev.map(u =>
        u.filename === file.name
          ? { ...u, status: "error", progress: 0, message: String(error) }
          : u
      ));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (supportedFormats.includes(ext)) {
        uploadFile(file);
      } else {
        setUploads(prev => [
          ...prev,
          {
            filename: file.name,
            status: "error",
            progress: 0,
            message: `Unsupported format. Allowed: ${supportedFormats.join(", ")}`,
          },
        ]);
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(uploadFile);
  };

  const clearUploads = () => {
    setUploads(uploads.filter(u => u.status === "uploading"));
  };

  const toggleSelectDoc = (filename: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(filename)) {
      newSelected.delete(filename);
    } else {
      newSelected.add(filename);
    }
    setSelectedDocs(newSelected);
  };

  const selectAll = () => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments.map(d => d.filename)));
    }
  };

  const deleteDocument = async (filename: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/${collectionName}/${encodeURIComponent(filename)}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (data.status === "success") {
        loadDocuments();
        onDocumentChange?.();
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const bulkDelete = async () => {
    if (selectedDocs.size === 0) return;

    try {
      const formData = new FormData();
      formData.append("collection_name", collectionName);
      formData.append("filenames", JSON.stringify(Array.from(selectedDocs)));

      const response = await fetch(`${API_BASE_URL}/api/documents/bulk-delete`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.status === "success") {
        loadDocuments();
        onDocumentChange?.();
        setSelectedDocs(new Set());
        setBulkDeleteConfirm(false);
      }
    } catch (error) {
      console.error("Error bulk deleting:", error);
    }
  };

  const previewDocument = async (filename: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/preview/${collectionName}/${encodeURIComponent(filename)}?max_chars=1000`
      );
      const data = await response.json();

      if (data.status === "success") {
        setPreviewContent(data.preview);
        setPreviewDoc(filename);
      }
    } catch (error) {
      console.error("Error previewing document:", error);
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || doc.file_type === filterType;
    return matchesSearch && matchesType;
  });

  // Get unique file types
  const fileTypes = Array.from(new Set(documents.map(d => d.file_type)));

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center transition-all
          ${
            isDragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
          }
        `}
      >
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-indigo-600" : "text-gray-400"}`} />
        <p className="text-base font-medium text-gray-700 mb-1">
          {isDragging ? "Drop files here" : "Drag & drop documents"}
        </p>
        <p className="text-sm text-gray-500 mb-3">
          Supported: {supportedFormats.join(", ")}
        </p>
        <label className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition">
          <input
            type="file"
            multiple
            accept={supportedFormats.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />
          Browse Files
        </label>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Upload Progress</h3>
            <button onClick={clearUploads} className="text-sm text-gray-500 hover:text-gray-700">
              Clear Completed
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploads.map((upload, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{upload.filename}</p>
                  </div>
                  {upload.status === "uploading" && (
                    <Loader className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0" />
                  )}
                  {upload.status === "success" && (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  )}
                  {upload.status === "error" && (
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                </div>
                {upload.status === "uploading" && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                {upload.message && (
                  <p className={`text-xs mt-1 ${upload.status === "error" ? "text-red-600" : "text-green-600"}`}>
                    {upload.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document List Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {fileTypes.map(type => (
                <option key={type} value={type}>{type.toUpperCase()}</option>
              ))}
            </select>

            <button
              onClick={loadDocuments}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDocs.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg mb-4">
            <span className="text-sm font-medium text-indigo-900">
              {selectedDocs.size} selected
            </span>
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 className="w-4 h-4 inline mr-1" />
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedDocs(new Set())}
              className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Collection Stats */}
        {collectionStats && (
          <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div>
              <span className="text-gray-600">Documents:</span>
              <span className="ml-2 font-medium text-gray-900">{documents.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Chunks:</span>
              <span className="ml-2 font-medium text-gray-900">{collectionStats.document_count}</span>
            </div>
            <div>
              <span className="text-gray-600">Collection:</span>
              <span className="ml-2 font-medium text-gray-900">{collectionName}</span>
            </div>
            <div>
              <span className="text-gray-600">Embedding:</span>
              <span className="ml-2 font-medium text-gray-900">{collectionStats.embedding_provider}</span>
            </div>
          </div>
        )}

        {/* Documents Table */}
        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 mx-auto text-indigo-600 animate-spin mb-2" />
            <p className="text-gray-600">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">
              {documents.length === 0 ? "No documents uploaded yet" : "No documents match your filters"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Select All */}
            <div className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg">
              <input
                type="checkbox"
                checked={selectedDocs.size === filteredDocuments.length}
                onChange={selectAll}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedDocs.size === filteredDocuments.length ? "Deselect All" : "Select All"}
              </span>
            </div>

            {/* Document Rows */}
            {filteredDocuments.map((doc) => (
              <div key={doc.filename} className="border border-gray-200 rounded-lg hover:border-indigo-300 transition">
                <div className="flex items-center gap-3 p-3">
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(doc.filename)}
                    onChange={() => toggleSelectDoc(doc.filename)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.filename}</p>
                    <p className="text-xs text-gray-500">
                      {doc.file_type.toUpperCase()} • {doc.chunks} chunks • {Math.round(doc.total_chars / 1000)}K chars
                      {doc.uploaded_at && ` • ${doc.uploaded_at}`}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => previewDocument(doc.filename)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDebugView(showDebugView === doc.filename ? null : doc.filename)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      title="Debug View"
                    >
                      {showDebugView === doc.filename ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(doc.filename)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Debug View */}
                {showDebugView === doc.filename && (
                  <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs font-mono">
                    <p className="font-semibold text-gray-700 mb-2">Document Metadata:</p>
                    <pre className="text-gray-600 overflow-x-auto">{JSON.stringify(doc.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Preview: {previewDoc}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{previewContent}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={true}
          title="Delete Document"
          message={`Are you sure you want to delete "${deleteConfirm}"? This will remove all chunks from the vector store.`}
          onConfirm={() => deleteDocument(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          confirmText="Delete"
          danger={true}
        />
      )}

      {/* Bulk Delete Confirmation */}
      {bulkDeleteConfirm && (
        <ConfirmModal
          isOpen={true}
          title="Bulk Delete"
          message={`Are you sure you want to delete ${selectedDocs.size} documents? This action cannot be undone.`}
          onConfirm={bulkDelete}
          onCancel={() => setBulkDeleteConfirm(false)}
          confirmText="Delete All"
          danger={true}
        />
      )}
    </div>
  );
}
