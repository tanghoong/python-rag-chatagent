import { useState } from "react";
import { Send } from "lucide-react";
import { VoiceInput } from "./VoiceInput";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ChatInput({ onSend, disabled = false, inputRef }: Readonly<ChatInputProps>) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          placeholder="Ask me anything..."
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 disabled:opacity-50 text-sm sm:text-base py-1"
          maxLength={2000}
        />
        <VoiceInput onTranscript={handleVoiceTranscript} disabled={disabled} />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="gradient-button disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 p-2 sm:p-2.5 min-w-[40px] min-h-[40px]"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </form>
  );
}
