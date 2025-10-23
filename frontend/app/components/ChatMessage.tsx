import { User, Bot } from "lucide-react";
import { ChatControls } from "./ChatControls";
import ThoughtProcess from "./ThoughtProcess";
import { QuickActions } from "./QuickActions";

interface ThoughtStep {
  step: string;
  content: string;
}

interface ChatMessageProps {
  role: "user" | "bot";
  content: string;
  messageId?: string;
  chatId?: string;
  thoughtProcess?: ThoughtStep[];
  isLastMessage?: boolean;
  isLastUserMessage?: boolean;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  onRegenerate?: (messageId: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
}

export function ChatMessage({ 
  role, 
  content, 
  messageId, 
  chatId,
  thoughtProcess,
  isLastMessage = false,
  isLastUserMessage = false,
  onEdit,
  onRegenerate,
  onDelete 
}: Readonly<ChatMessageProps>) {
  const isUser = role === "user";
  const normalizedRole = role === "bot" ? "assistant" : role;

  return (
    <div className={`group flex items-start space-x-3 animate-fade-in ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
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
        
        {/* Thought Process - Only for bot messages */}
        {!isUser && thoughtProcess && thoughtProcess.length > 0 && (
          <ThoughtProcess steps={thoughtProcess} />
        )}
        
        {/* Quick Actions - Only for bot messages */}
        {!isUser && <QuickActions content={content} messageId={messageId} />}
        
        {/* Chat Controls */}
        {messageId && chatId && onEdit && onRegenerate && onDelete && (
          <ChatControls
            messageId={messageId}
            chatId={chatId}
            role={normalizedRole}
            content={content}
            isLastMessage={isLastMessage}
            isLastUserMessage={isLastUserMessage}
            onEdit={onEdit}
            onRegenerate={onRegenerate}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}
