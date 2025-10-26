import { useState, useEffect } from "react";
import { X, Plus, Tag } from "lucide-react";
import type { Memory } from "../hooks/useMemoryCRUD";

interface MemoryEditorProps {
  readonly memory?: Memory | null;
  readonly collection: string;
  readonly onSave: (data: { content: string; tags: string[]; metadata: Record<string, any> }) => Promise<void>;
  readonly onCancel: () => void;
  readonly isLoading?: boolean;
}

export function MemoryEditor({
  memory,
  collection,
  onSave,
  onCancel,
  isLoading = false,
}: MemoryEditorProps) {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<{ content?: string; tags?: string }>({});

  // Load memory data if editing
  useEffect(() => {
    if (memory) {
      setContent(memory.content);
      setTags(memory.tags || []);
    } else {
      setContent("");
      setTags([]);
    }
  }, [memory]);

  const validate = (): boolean => {
    const newErrors: { content?: string; tags?: string } = {};

    if (!content.trim()) {
      newErrors.content = "Content is required";
    } else if (content.length < 10) {
      newErrors.content = "Content must be at least 10 characters";
    } else if (content.length > 10000) {
      newErrors.content = "Content must be less than 10,000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    
    if (!tag) return;
    
    if (tags.includes(tag)) {
      setErrors({ ...errors, tags: "Tag already added" });
      return;
    }

    if (tag.length > 50) {
      setErrors({ ...errors, tags: "Tag must be less than 50 characters" });
      return;
    }

    setTags([...tags, tag]);
    setTagInput("");
    setErrors({ ...errors, tags: undefined });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSave({
      content: content.trim(),
      tags,
      metadata: memory?.metadata || {},
    });
  };

  const getButtonText = () => {
    if (isLoading) return "Saving...";
    return memory ? "Update Memory" : "Create Memory";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {memory ? "Edit Memory" : "Create Memory"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Collection: <span className="font-mono">{collection}</span>
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Content Field */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Content *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setErrors({ ...errors, content: undefined });
            }}
            rows={6}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
              errors.content
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="Enter the information you want the AI to remember..."
            disabled={isLoading}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {content.length} / 10,000 characters
          </p>
        </div>

        {/* Tags Field */}
        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Tags
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setErrors({ ...errors, tags: undefined });
                }}
                onKeyDown={handleKeyPress}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                  errors.tags
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Add tags (press Enter)"
                disabled={isLoading}
              />
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              disabled={isLoading || !tagInput.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          {errors.tags && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tags}</p>
          )}

          {/* Tag List */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 transition-colors"
                    disabled={isLoading}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {getButtonText()}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
