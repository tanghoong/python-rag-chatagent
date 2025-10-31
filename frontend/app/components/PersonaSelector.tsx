import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";

export interface Persona {
  _id: string;
  name: string;
  description: string;
  system_prompt: string;
  temperature: number;
  is_system: boolean;
  avatar_emoji?: string;
  capabilities?: string[];
  tags?: string[];
  use_count: number;
  created_at: string;
  updated_at: string;
}

interface PersonaSelectorProps {
  activeChatId: string | null;
  currentPersonaId?: string;
  onPersonaChange?: (personaId: string) => void;
  onCreatePersona?: () => void;
}

export function PersonaSelector({
  activeChatId,
  currentPersonaId,
  onPersonaChange,
  onCreatePersona,
}: Readonly<PersonaSelectorProps>) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load personas on mount
  useEffect(() => {
    loadPersonas();
  }, []);

  // Update selected persona when currentPersonaId changes
  useEffect(() => {
    if (currentPersonaId && personas.length > 0) {
      const persona = personas.find((p) => p._id === currentPersonaId);
      if (persona) {
        setSelectedPersona(persona);
      }
    } else if (personas.length > 0) {
      // Default to first persona (usually Mira)
      const defaultPersona = personas.find((p) => p.is_system) || personas[0];
      setSelectedPersona(defaultPersona);
    }
  }, [currentPersonaId, personas]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/personas/list");
      if (!response.ok) {
        throw new Error("Failed to load personas");
      }
      const data = await response.json();
      setPersonas(data.personas || []);
    } catch (error) {
      console.error("Error loading personas:", error);
      toast.error("Failed to load personas");
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaSelect = async (persona: Persona) => {
    if (!activeChatId) {
      toast.error("No active chat session");
      return;
    }

    try {
      // Update chat's persona
      const response = await fetch(`/api/chats/${activeChatId}/persona`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ persona_id: persona._id }),
      });

      if (!response.ok) {
        throw new Error("Failed to update persona");
      }

      // Track persona usage
      await fetch(`/api/personas/${persona._id}/use`, {
        method: "POST",
      });

      setSelectedPersona(persona);
      setDropdownOpen(false);
      onPersonaChange?.(persona._id);
      toast.success(`Switched to ${persona.name}`);
    } catch (error) {
      console.error("Error selecting persona:", error);
      toast.error("Failed to switch persona");
    }
  };

  const handleCreatePersona = () => {
    setDropdownOpen(false);
    onCreatePersona?.();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
        <div className="w-6 h-6 rounded-full bg-white/20 animate-pulse" />
        <span className="text-sm text-white/60">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Persona Button */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
        title={selectedPersona ? `Current: ${selectedPersona.name}` : "Select Persona"}
      >
        {/* Avatar */}
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-linear-to-br from-purple-500 to-blue-500 text-white text-sm font-semibold">
          {selectedPersona?.avatar_emoji || "🤖"}
        </div>

        {/* Persona Name */}
        <span className="text-sm font-medium text-white">
          {selectedPersona?.name || "Select Persona"}
        </span>

        {/* Dropdown Icon */}
        <ChevronDown
          className={`w-4 h-4 text-white/60 transition-transform ${
            dropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              AI Personas
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Choose an AI personality for this chat
            </p>
          </div>

          {/* Persona List */}
          <div className="py-2">
            {personas.map((persona) => (
              <button
                key={persona._id}
                onClick={() => handlePersonaSelect(persona)}
                className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-purple-50 transition-colors ${
                  selectedPersona?._id === persona._id ? "bg-purple-100" : ""
                }`}
              >
                {/* Avatar */}
                <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-blue-500 text-white text-lg">
                  {persona.avatar_emoji || "🤖"}
                </div>

                {/* Persona Info */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {persona.name}
                    </h4>
                    {selectedPersona?._id === persona._id && (
                      <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                    {persona.description}
                  </p>
                  {persona.tags && persona.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {persona.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Create Custom Persona Button */}
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={handleCreatePersona}
              className="w-full px-4 py-2.5 flex items-center justify-center gap-2 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Custom Persona
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
