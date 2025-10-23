import { useState } from "react";
import { Copy, ThumbsUp, ThumbsDown, Check } from "lucide-react";

interface QuickActionsProps {
  content: string;
  messageId?: string;
  onFeedback?: (messageId: string, feedback: "up" | "down") => void;
}

export function QuickActions({ content, messageId, onFeedback }: Readonly<QuickActionsProps>) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type);
    if (messageId && onFeedback) {
      onFeedback(messageId, type);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="p-1.5 rounded hover:bg-white/10 transition-colors text-white/50 hover:text-white/80"
        title={copied ? "Copied!" : "Copy message"}
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      {/* Thumbs up */}
      <button
        onClick={() => handleFeedback("up")}
        className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
          feedback === "up" ? "text-green-400" : "text-white/50 hover:text-white/80"
        }`}
        title="Good response"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>

      {/* Thumbs down */}
      <button
        onClick={() => handleFeedback("down")}
        className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
          feedback === "down" ? "text-red-400" : "text-white/50 hover:text-white/80"
        }`}
        title="Bad response"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
