import { useState, useEffect } from "react";
import { X, Save, Sparkles, Trash2, User, Brain, Thermometer } from "lucide-react";
import { toast } from "sonner";
import type { Persona } from "./PersonaSelector";

interface PersonaEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (persona: Persona) => void;
  personaToEdit?: Persona | null;
}

export function PersonaEditor({
  isOpen,
  onClose,
  onSave,
  personaToEdit,
}: Readonly<PersonaEditorProps>) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("🤖");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.2);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [capabilityInput, setCapabilityInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load persona data when editing
  useEffect(() => {
    if (personaToEdit) {
      setName(personaToEdit.name);
      setDescription(personaToEdit.description);
      setAvatarEmoji(personaToEdit.avatar_emoji || "🤖");
      setSystemPrompt(personaToEdit.system_prompt);
      setTemperature(personaToEdit.temperature);
      setTags(personaToEdit.tags || []);
      setCapabilities(personaToEdit.capabilities || []);
    } else {
      resetForm();
    }
  }, [personaToEdit]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setAvatarEmoji("🤖");
    setSystemPrompt("");
    setTemperature(0.2);
    setTags([]);
    setCapabilities([]);
    setTagInput("");
    setCapabilityInput("");
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddCapability = () => {
    const trimmedCapability = capabilityInput.trim();
    if (trimmedCapability && !capabilities.includes(trimmedCapability)) {
      setCapabilities([...capabilities, trimmedCapability]);
      setCapabilityInput("");
    }
  };

  const handleRemoveCapability = (capabilityToRemove: string) => {
    setCapabilities(capabilities.filter((cap) => cap !== capabilityToRemove));
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      toast.error("Please enter a persona name");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!systemPrompt.trim()) {
      toast.error("Please enter a system prompt");
      return;
    }

    setSaving(true);
    try {
      const personaData = {
        name: name.trim(),
        description: description.trim(),
        avatar_emoji: avatarEmoji,
        system_prompt: systemPrompt.trim(),
        temperature,
        tags,
        capabilities,
      };

      let response;
      if (personaToEdit && !personaToEdit.is_system) {
        // Update existing custom persona
        response = await fetch(`/api/personas/${personaToEdit._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(personaData),
        });
      } else {
        // Create new persona
        response = await fetch("/api/personas/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(personaData),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to save persona");
      }

      const savedPersona = await response.json();
      toast.success(
        personaToEdit ? "Persona updated successfully" : "Persona created successfully"
      );
      onSave?.(savedPersona);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error saving persona:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save persona");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!personaToEdit || personaToEdit.is_system) {
      toast.error("Cannot delete system personas");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${personaToEdit.name}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/personas/${personaToEdit._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete persona");
      }

      toast.success("Persona deleted successfully");
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error deleting persona:", error);
      toast.error("Failed to delete persona");
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-purple-600 to-blue-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {personaToEdit ? "Edit Persona" : "Create Custom Persona"}
              </h2>
              <p className="text-sm text-gray-500">
                Customize your AI assistant's personality and behavior
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Avatar & Name Row */}
            <div className="grid grid-cols-[auto,1fr] gap-4">
              {/* Avatar Emoji */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar
                </label>
                <input
                  type="text"
                  value={avatarEmoji}
                  onChange={(e) => setAvatarEmoji(e.target.value)}
                  placeholder="🤖"
                  maxLength={2}
                  className="w-16 h-16 text-3xl text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Persona Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Code Expert, Creative Writer"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={personaToEdit?.is_system}
                />
                {personaToEdit?.is_system && (
                  <p className="text-xs text-amber-600 mt-1">
                    System personas cannot be edited
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this persona's role and expertise..."
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={personaToEdit?.is_system}
              />
            </div>

            {/* System Prompt */}
            <div>
              <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                <Brain className="w-4 h-4 inline mr-1" />
                System Prompt
              </label>
              <textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful AI assistant specialized in..."
                rows={8}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-none"
                disabled={personaToEdit?.is_system}
              />
              <p className="text-xs text-gray-500 mt-1">
                This prompt defines the persona's behavior and expertise
              </p>
            </div>

            {/* Temperature Slider */}
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-2">
                <Thermometer className="w-4 h-4 inline mr-1" />
                Temperature: {temperature.toFixed(1)}
              </label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number.parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={personaToEdit?.is_system}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused (0.0)</span>
                <span>Balanced (0.5)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tag-input" className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  id="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={personaToEdit?.is_system}
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  disabled={personaToEdit?.is_system}
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    {!personaToEdit?.is_system && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-purple-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <label htmlFor="capability-input" className="block text-sm font-medium text-gray-700 mb-2">
                Capabilities
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  id="capability-input"
                  type="text"
                  value={capabilityInput}
                  onChange={(e) => setCapabilityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCapability();
                    }
                  }}
                  placeholder="Add a capability..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={personaToEdit?.is_system}
                />
                <button
                  onClick={handleAddCapability}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  disabled={personaToEdit?.is_system}
                >
                  Add
                </button>
              </div>
              <div className="space-y-1">
                {capabilities.map((capability) => (
                  <div
                    key={capability}
                    className="px-3 py-2 bg-gray-50 rounded-lg text-sm flex items-center justify-between"
                  >
                    <span>{capability}</span>
                    {!personaToEdit?.is_system && (
                      <button
                        onClick={() => handleRemoveCapability(capability)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div>
            {personaToEdit && !personaToEdit.is_system && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || personaToEdit?.is_system}
              className="px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {(() => {
                if (saving) return "Saving...";
                if (personaToEdit) return "Update";
                return "Create";
              })()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
