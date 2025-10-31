import { CheckSquare, Trash2, Tag, X } from "lucide-react";
import { useState } from "react";
import { TagEditor } from "./TagEditor";

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  availableTags: string[];
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onBulkTag: (tags: string[]) => Promise<void>;
  onCancel: () => void;
}

export function BulkActions({
  selectedCount,
  totalCount,
  availableTags,
  onSelectAll,
  onBulkDelete,
  onBulkTag,
  onCancel,
}: Readonly<BulkActionsProps>) {
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleBulkTag = async (tags: string[]) => {
    await onBulkTag(tags);
    setShowTagEditor(false);
  };

  const handleConfirmDelete = () => {
    onBulkDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="p-3 bg-purple-500/10 border-b border-purple-500/30 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">
            {selectedCount} of {totalCount} selected
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Cancel"
          type="button"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Actions */}
      {!showTagEditor && !showDeleteConfirm && (
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="flex-1 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-md transition-colors"
            type="button"
          >
            {selectedCount === totalCount ? "Deselect All" : "Select All"}
          </button>
          <button
            onClick={() => setShowTagEditor(true)}
            disabled={selectedCount === 0}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add tags to selected chats"
            type="button"
          >
            <Tag className="w-3 h-3" />
            Tag
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={selectedCount === 0}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete selected chats"
            type="button"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      )}

      {/* Tag Editor */}
      {showTagEditor && (
        <TagEditor
          tags={[]}
          availableTags={availableTags}
          onSave={handleBulkTag}
          onCancel={() => setShowTagEditor(false)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="space-y-2 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
          <p className="text-sm text-red-300">
            Are you sure you want to delete {selectedCount} {selectedCount === 1 ? 'chat' : 'chats'}?
            This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmDelete}
              className="flex-1 px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors font-medium"
              type="button"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-md transition-colors"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
