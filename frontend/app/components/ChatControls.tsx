import { useState } from "react";
import { Edit2, RefreshCw, Trash2, Check, X } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";

interface ChatControlsProps {
  messageId: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  onEdit: (messageId: string, newContent: string) => Promise<void>;
  onRegenerate: (messageId: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}

export function ChatControls({
  messageId,
  chatId,
  role,
  content,
  onEdit,
  onRegenerate,
  onDelete,
}: Readonly<ChatControlsProps>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSave = async () => {
    if (!editedContent.trim() || editedContent === content) {
      setIsEditing(false);
      return;
    }

    try {
      setLoading(true);
      await onEdit(messageId, editedContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    try {
      setLoading(true);
      await onRegenerate(messageId);
    } catch (error) {
      console.error("Failed to regenerate:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await onDelete(messageId);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete message:", error);
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="mt-2 space-y-2">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40 resize-none"
          rows={3}
          disabled={loading}
        />
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={loading || !editedContent.trim()}
            className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-xs text-green-400 disabled:opacity-50"
          >
            <Check className="w-3 h-3" />
            <span>Save</span>
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-xs text-red-400 disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {/* Edit button - only for user messages */}
      {role === "user" && (
        <button
          onClick={() => setIsEditing(true)}
          disabled={loading}
          className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
          title="Edit message"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Regenerate button - only for assistant messages */}
      {role === "assistant" && (
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
          title="Regenerate response"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      )}

      {/* Delete button - for both */}
      <button
        onClick={() => setShowDeleteModal(true)}
        disabled={loading}
        className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
        title="Delete message"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        danger
      />
    </div>
  );
}
