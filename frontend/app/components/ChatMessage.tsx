import { User, Bot } from "lucide-react";
import { ChatControls } from "./ChatControls";
import ThoughtProcess from "./ThoughtProcess";
import { LLMBadge } from "./LLMBadge";
import { QuickActions } from "./QuickActions";
import { RetrievalContext } from "./RetrievalContext";
import { CompactMessageStatus } from "./MessageStatusIndicator";
import type { MessageStatus } from "./MessageStatusIndicator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";
import type { Components } from "react-markdown";
import { formatRelativeTime, formatFullDateTime } from "../utils/dateUtils";
import { useMemo } from "react";

// Markdown component overrides factory function
const createMarkdownComponents = (): Components => ({
  code({ inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    // Safely convert children to string
    let content = '';
    if (typeof children === 'string') {
      content = children.replace(/\n$/, '');
    } else if (children) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      content = String(children).replace(/\n$/, '');
    }
    
    return (
      <CodeBlock 
        language={match ? match[1] : undefined}
        inline={inline}
      >
        {content}
      </CodeBlock>
    );
  },
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-1.5 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="ml-1.5">{children}</li>,
  h1: ({ children }) => <h1 className="text-lg font-bold mb-1.5 mt-3 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold mb-1.5 mt-2.5 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold mb-1.5 mt-2 first:mt-0">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-purple-500 pl-3 italic my-1.5 text-gray-300">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a href={href} className="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto code-scroll my-2">
      <table className="min-w-full border border-gray-700">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-gray-700 px-3 py-2 bg-gray-800 font-semibold text-left">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-700 px-3 py-2">{children}</td>
  ),
});

interface ThoughtStep {
  step: string;
  content: string;
}

interface LLMMetadata {
  auto_switched: boolean;
  model: string;
  provider: string;
  complexity: string;
  complexity_score?: number;
  indicators?: string[];
  word_count?: number;
}

interface RetrievalContextData {
  chunks: Array<{
    content: string;
    relevance_score: number;
    source: string;
    metadata?: Record<string, any>;
    chunk_id?: string;
  }>;
  search_queries: string[];
  search_strategies: string[];
  total_searches: number;
  unique_sources: string[];
  total_chunks: number;
  timestamp?: string;
}

interface ChatMessageProps {
  role: "user" | "bot";
  content: string;
  messageId?: string;
  chatId?: string;
  thoughtProcess?: ThoughtStep[];
  llmMetadata?: LLMMetadata;
  retrievalContext?: RetrievalContextData;
  isLastMessage?: boolean;
  isLastUserMessage?: boolean;
  timestamp?: string;
  messageStatus?: MessageStatus;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  onRegenerate?: (messageId: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onRetrievalFeedback?: (chunkId: string, helpful: boolean) => void;
}

export function ChatMessage({ 
  role, 
  content, 
  messageId, 
  chatId,
  thoughtProcess,
  llmMetadata,
  retrievalContext,
  isLastMessage = false,
  isLastUserMessage = false,
  timestamp,
  messageStatus = 'sent',
  onEdit,
  onRegenerate,
  onDelete,
  onRetrievalFeedback
}: Readonly<ChatMessageProps>) {
  const isUser = role === "user";
  const normalizedRole = role === "bot" ? "assistant" : role;

  // Memoize markdown components to prevent unnecessary re-renders
  const markdownComponents = useMemo(() => createMarkdownComponents(), []);

  // Only force re-render when content actually changes significantly
  // Use a hash of first/last 50 chars instead of length for better stability
  const contentKey = useMemo(() => {
    const start = content.slice(0, 50);
    const end = content.slice(-50);
    return `${start}-${content.length}-${end}`;
  }, [content]);

  // Enhanced animation logic for messages
  const getAnimationClass = () => {
    if (isUser) {
      // User messages slide in from the right with a slight bounce
      return 'animate-slide-in-right';
    }
    
    // For bot messages, use different animations based on context
    if (isLastMessage) {
      if (content.length < 30) {
        // Very short content (likely just started streaming)
        return 'animate-pop-in';
      } else if (content.length < 100) {
        // Short to medium content
        return 'animate-slide-up-fade';
      } else {
        // Longer content
        return 'animate-float-in';
      }
    }
    
    // Non-last messages use subtle slide-in
    return 'animate-slide-in-left';
  };

  const animationClass = getAnimationClass();

  return (
    <article 
      className={`group flex items-start gap-2 ${animationClass} px-1 sm:px-0`}
      aria-label={`${isUser ? 'User' : 'Assistant'} message`}
    >
      {/* Compact Avatar with contextual animations */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div 
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center relative ${
            isUser 
              ? "bg-linear-to-br from-cyan-500 to-blue-500" 
              : "bg-linear-to-br from-purple-500 to-cyan-500"
          } ${isLastMessage && !isUser ? 'animate-bounce-subtle' : ''} 
          ${isLastMessage ? 'ring-1 ring-white/20 ring-offset-1 ring-offset-transparent' : ''} 
          transition-all duration-300 hover:scale-110`}
          aria-label={isUser ? 'User avatar' : 'AI assistant avatar'}
        >
          {/* Pulse effect for new messages */}
          {isLastMessage && (
            <div className={`absolute -inset-1 rounded-full opacity-30 animate-ping ${
              isUser ? 'bg-cyan-400' : 'bg-purple-400'
            }`} />
          )}
          
          {isUser ? (
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white relative z-10" />
          ) : (
            <Bot className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-white relative z-10 ${
              isLastMessage ? 'animate-pulse' : ''
            }`} />
          )}
        </div>
      </div>

      {/* Enhanced Message bubble with improved design and contrast */}
      <div 
        className={`flex-1 max-w-3xl transition-all duration-300 hover:shadow-lg ${
          isUser 
            ? "bg-linear-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-lg py-1.5 px-2.5 sm:px-3" 
            : "bg-linear-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/40 rounded-lg py-1.5 px-2.5 sm:px-3"
        } ${isLastMessage ? 'shadow-md ring-1 ring-white/10' : ''} relative overflow-hidden backdrop-blur-sm`}
      >
        {/* Shimmer effect for new messages */}
        {isLastMessage && (
          <div className={`absolute inset-0 opacity-20 ${
            isUser 
              ? 'bg-linear-to-r from-transparent via-cyan-400/30 to-transparent' 
              : 'bg-linear-to-r from-transparent via-purple-400/30 to-transparent'
          } animate-shimmer`} 
          style={{
            animation: 'shimmer 2s ease-in-out',
            backgroundSize: '200% 100%'
          }}
          />
        )}
        {/* Header Row - Role, Timestamp, LLM Badge */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${isUser ? 'text-cyan-400' : 'text-purple-400'}`}>
              {isUser ? 'You' : 'Assistant'}
            </span>
            {timestamp && (
              <span 
                className="text-[10px] sm:text-xs text-gray-400 hover:text-gray-300 cursor-help transition-colors"
                title={formatFullDateTime(timestamp)}
              >
                {formatRelativeTime(timestamp)}
              </span>
            )}
            
            {/* Message Status Indicator - only for user messages */}
            {isUser && (
              <CompactMessageStatus 
                status={messageStatus}
                isUserMessage={isUser}
                timestamp={timestamp}
              />
            )}
          </div>
          
          {/* LLM Metadata Badge - inline on header */}
          {!isUser && llmMetadata && (
            <LLMBadge metadata={llmMetadata} />
          )}
        </div>

        {/* Message Content with enhanced readability */}
        <div className={`prose prose-invert max-w-none leading-relaxed text-sm prose-pre:p-0 prose-pre:m-0 prose-pre:bg-transparent ${
          isUser ? 'text-white' : 'text-gray-50'
        } ${isLastMessage && !isUser && content.length > 0 ? 'animate-fade-in-delayed' : ''}`}>
          <ReactMarkdown
            key={contentKey}
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
          
          {/* Enhanced typing cursor for streaming messages */}
          {isLastMessage && !isUser && content.length > 0 && (
            <span className="inline-block w-0.5 h-4 bg-purple-400 animate-typing ml-1 rounded-sm shadow-sm"></span>
          )}
        </div>
        
        {/* Thought Process - Only for bot messages */}
        {!isUser && thoughtProcess && thoughtProcess.length > 0 && (
          <ThoughtProcess steps={thoughtProcess} />
        )}
        
        {/* Retrieval Context - Only for bot messages */}
        {!isUser && retrievalContext && retrievalContext.total_chunks > 0 && (
          <RetrievalContext 
            context={retrievalContext} 
            messageId={messageId}
            onFeedback={onRetrievalFeedback}
          />
        )}
        
        {/* Actions Row - Quick Actions + Chat Controls in one row */}
        {messageId && chatId && (
          <div className="flex items-center justify-between gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Left: Quick Actions (for bot) or Empty (for user) */}
            <div className="flex items-center gap-1">
              {!isUser && <QuickActions content={content} messageId={messageId} />}
            </div>
            
            {/* Right: Chat Controls */}
            {onEdit && onRegenerate && onDelete && (
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
        )}
      </div>
    </article>
  );
}
