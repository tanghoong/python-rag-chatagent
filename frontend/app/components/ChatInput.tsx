import { useState, useRef, useEffect } from "react";
import { Send, Square, Loader2 } from "lucide-react";
import { VoiceInput } from "./VoiceInput";

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
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || internalRef;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
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

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
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
    <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
      <div className="flex items-center gap-2 px-3 py-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask me anything... (Shift + Enter for new line)"
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400/60 disabled:opacity-50 text-sm resize-none min-h-[24px] max-h-[200px] px-2 py-1.5 custom-scrollbar rounded"
          maxLength={2000}
          rows={1}
        />
        <div className="flex items-center gap-1.5">
          <VoiceInput onTranscript={handleVoiceTranscript} disabled={disabled || loading} />
          <button
            type="submit"
            disabled={disabled || !input.trim() || loading}
            className="bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 transition-all shadow-lg shadow-purple-500/20"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      {/* Character count indicator */}
      {input.length > 1800 && (
        <div className="px-4 pb-1.5 text-right">
          <span className={`text-xs ${input.length >= 2000 ? 'text-red-400' : 'text-white/40'}`}>
            {input.length} / 2000
          </span>
        </div>
      )}
    </form>
  );
}
