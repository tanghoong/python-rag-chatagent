import { useState, useRef, useEffect } from "react";
import { Send, Square, Loader2, Sparkles } from "lucide-react";
import { VoiceInput } from "./VoiceInput";
import { QuickTemplates } from "./QuickTemplates";
import { PromptTemplates } from "./PromptTemplates";

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({ 
  onSend, 
  onCancel,
  disabled = false, 
  loading = false,
  error = null,
  inputRef 
}: Readonly<ChatInputProps>) {
  const [input, setInput] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQuickTemplates, setShowQuickTemplates] = useState(false);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || internalRef;
  const maxLength = 2000;
  const charCount = input.length;
  const charPercentage = (charCount / maxLength) * 100;

  // Auto-resize textarea with smooth transition
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height based on content, with min and max constraints
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [input, textareaRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled && !loading) {
      onSend(input.trim());
      setInput("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enter for new line
    if (e.key === "Enter" && e.shiftKey) {
      return; // Allow default behavior (new line)
    }
    // Enter to submit (without shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
  };

  const handleTemplateSelect = (template: any) => {
    setInput(template.prompt_text);
    setShowTemplates(false);
    setShowQuickTemplates(false);
    // Focus on textarea after template selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(template.prompt_text.length, template.prompt_text.length);
      }
    }, 100);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Get progress bar color based on character count
  const getProgressBarColor = () => {
    if (charCount >= maxLength) return 'bg-red-500';
    if (charCount >= maxLength * 0.9) return 'bg-yellow-500';
    return 'bg-linear-to-r from-purple-500 to-blue-500';
  };

  // Get character count color based on usage
  const getCharCountColor = () => {
    if (charCount >= maxLength) return 'text-red-400 font-semibold';
    if (charCount >= maxLength * 0.9) return 'text-yellow-400';
    return 'text-white/40';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            <span className="text-white/70 text-sm">Thinking...</span>
          </div>
          {onCancel && (
            <button
              onClick={handleCancel}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Cancel"
            >
              <Square className="w-3.5 h-3.5 text-white/70 fill-current" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border-2 border-red-500/50 rounded-2xl px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
          <button
            onClick={() => {
              // Retry by clearing error (parent should handle this)
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
            className="text-white/70 hover:text-white text-sm transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-white/30 focus-within:border-purple-500/50 rounded-2xl shadow-xl shadow-black/20 transition-all duration-200">
      <div className="flex items-end gap-2 px-3 py-2.5">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask me anything... (Shift + Enter for new line)"
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400/50 disabled:opacity-50 text-sm resize-none min-h-10 max-h-[200px] px-2 py-2 custom-scrollbar rounded transition-all"
          style={{ transition: 'height 0.1s ease-out' }}
          maxLength={maxLength}
          rows={1}
        />
        <div className="flex items-center gap-1.5 pb-0.5">
          <button
            type="button"
            onClick={() => setShowQuickTemplates(!showQuickTemplates)}
            disabled={disabled}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
            title="Template prompts"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <VoiceInput onTranscript={handleVoiceTranscript} disabled={disabled || loading} />
          <button
            type="submit"
            disabled={disabled || !input.trim() || loading}
            className="bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-full p-2.5 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      {/* Character count indicator - always visible */}
      <div className="flex items-center justify-between px-4 pb-2 pt-0.5">
        <div className="text-xs text-white/30">
          {input.trim() ? `${input.trim().split(/\s+/).length} words` : 'Type your message...'}
        </div>
        <div className="flex items-center gap-2">
          {charCount > 0 && (
            <div className="h-1 w-20 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
                style={{ width: `${Math.min(charPercentage, 100)}%` }}
              />
            </div>
          )}
          <span className={`text-xs transition-colors ${getCharCountColor()}`}>
            {charCount} / {maxLength}
          </span>
        </div>
      </div>

      {/* Quick Templates Dropdown */}
      {showQuickTemplates && (
        <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
          <QuickTemplates 
            onSelectTemplate={handleTemplateSelect}
            onOpenFullTemplates={() => {
              setShowQuickTemplates(false);
              setShowTemplates(true);
            }}
          />
        </div>
      )}

      {/* Full Templates Modal */}
      <PromptTemplates 
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleTemplateSelect}
      />
      </form>
    </div>
  );
}
