import { useState } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: Readonly<ChatInputProps>) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card">
      <div className="flex items-center space-x-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          placeholder="Ask me anything..."
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 disabled:opacity-50"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="gradient-button disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 p-3"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
