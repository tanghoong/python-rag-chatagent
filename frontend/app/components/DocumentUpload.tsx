/**
 * Document Upload Component
 * 
 * Allows users to upload documents to the RAG system.
 * Supports: PDF, TXT, MD, DOCX, HTML
 */

import { useState } from "react";
import { Upload, File, CheckCircle, XCircle, Loader } from "lucide-react";
import { API_BASE_URL } from "../config";

interface UploadStatus {
  filename: string;
  status: "uploading" | "success" | "error";
  message?: string;
}

interface DocumentUploadProps {
  onUploadComplete?: (filename: string) => void;
  chatId?: string;
  scope?: "global" | "chat";
}

export function DocumentUpload({ onUploadComplete, chatId, scope = "global" }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);

  const supportedFormats = [".pdf", ".txt", ".md", ".docx", ".html"];

  const uploadFile = async (file: File) => {
    // Add upload status
    setUploads(prev => [...prev, { filename: file.name, status: "uploading" }]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", scope);
    if (chatId && scope === "chat") {
      formData.append("chat_id", chatId);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status === "success") {
        setUploads(prev =>
          prev.map(u =>
            u.filename === file.name
              ? { ...u, status: "success", message: data.message }
              : u
          )
        );
        onUploadComplete?.(file.name);
      } else {
        setUploads(prev =>
          prev.map(u =>
            u.filename === file.name
              ? { ...u, status: "error", message: data.message || "Upload failed" }
              : u
          )
        );
      }
    } catch (error) {
      setUploads(prev =>
        prev.map(u =>
          u.filename === file.name
            ? { ...u, status: "error", message: String(error) }
            : u
        )
      );
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
    setUploads([]);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${
            isDragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
          }
        `}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-indigo-600" : "text-gray-400"}`} />
        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragging ? "Drop files here" : "Drag & drop documents"}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supported: {supportedFormats.join(", ")}
        </p>
        <label className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition">
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

      {/* Upload Status List */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Upload Status</h3>
            <button
              onClick={clearUploads}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploads.map((upload, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <File className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {upload.filename}
                  </p>
                  {upload.message && (
                    <p className={`text-xs ${upload.status === "error" ? "text-red-600" : "text-green-600"}`}>
                      {upload.message}
                    </p>
                  )}
                </div>
                {upload.status === "uploading" && (
                  <Loader className="w-5 h-5 text-indigo-600 animate-spin flex-shrink-0" />
                )}
                {upload.status === "success" && (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
                {upload.status === "error" && (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scope Indicator */}
      <div className="text-sm text-gray-600 text-center">
        Uploading to: <span className="font-medium">{scope === "global" ? "🌐 Global Memory" : "💬 Chat Memory"}</span>
      </div>
    </div>
  );
}
