import { useState, useRef, useEffect } from "react";
import { X, Plus, Tag as TagIcon } from "lucide-react";

interface TagEditorProps {
  tags: string[];
  onSave: (tags: string[]) => Promise<void>;
  onCancel: () => void;
  availableTags?: string[];
}

export function TagEditor({ tags, onSave, onCancel, availableTags = [] }: Readonly<TagEditorProps>) {
  const [currentTags, setCurrentTags] = useState<string[]>(tags);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAddTag = () => {
    const trimmedTag = inputValue.trim().toLowerCase();
    if (trimmedTag && !currentTags.includes(trimmedTag)) {
      setCurrentTags([...currentTags, trimmedTag]);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(currentTags);
    } catch (error) {
      console.error("Failed to save tags:", error);
    } finally {
      setSaving(false);
    }
  };

  // Get suggestions (existing tags not already added)
  const suggestions = availableTags.filter(
    tag => !currentTags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <form 
      className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10" 
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      aria-label="Tag editor"
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <TagIcon className="w-4 h-4 text-purple-400" />
        <span>Manage Tags</span>
      </div>

      {/* Current Tags */}
      {currentTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {currentTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md text-xs border border-purple-500/30"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:bg-purple-500/30 rounded-sm transition-colors"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a tag..."
          className="w-full px-3 py-1.5 text-sm bg-white/10 rounded-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400"
          maxLength={30}
        />
        <button
          onClick={handleAddTag}
          disabled={!inputValue.trim()}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          type="button"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && inputValue && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400">Suggestions:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => {
                  setCurrentTags([...currentTags, tag]);
                  setInputValue("");
                }}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-md text-xs border border-white/10 transition-colors"
                type="button"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-3 py-1.5 text-sm bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 rounded-md transition-colors font-medium"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors"
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
