import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "bot";
  content: string;
}

export function ChatMessage({ role, content }: Readonly<ChatMessageProps>) {
  const isUser = role === "user";

  return (
    <div className={`flex items-start space-x-3 animate-fade-in ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
      {/* Avatar */}
      <div 
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
          isUser 
            ? "bg-gradient-to-br from-cyan-500 to-blue-500" 
            : "bg-gradient-to-br from-purple-500 to-cyan-500"
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      {/* Message bubble */}
      <div 
        className={`glass-card flex-1 max-w-3xl py-2 px-3 ${
          isUser ? "bg-white/10" : ""
        }`}
      >
        <div className="whitespace-pre-wrap text-gray-100 leading-relaxed text-sm">
          {content}
        </div>
      </div>
    </div>
  );
}
