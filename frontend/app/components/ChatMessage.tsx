import { User, Bot } from "lucide-react";
import { ChatControls } from "./ChatControls";
import ThoughtProcess from "./ThoughtProcess";
import { LLMBadge } from "./LLMBadge";
import { QuickActions } from "./QuickActions";
import { RetrievalContext } from "./RetrievalContext";
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
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="ml-2">{children}</li>,
  h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2 first:mt-0">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-purple-500 pl-4 italic my-2 text-gray-300">
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

  return (
    <div className={`group flex items-start gap-2 sm:gap-3 animate-fade-in px-2 sm:px-0`}>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div 
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? "bg-linear-to-br from-cyan-500 to-blue-500" 
              : "bg-linear-to-br from-purple-500 to-cyan-500"
          }`}
        >
          {isUser ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
        </div>
      </div>

      {/* Message bubble */}
      <div 
        className={`flex-1 max-w-3xl transition-all duration-200 ${
          isUser 
            ? "bg-linear-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl py-2 px-3 sm:px-4" 
            : "bg-white/5 border border-white/10 rounded-2xl py-2 px-3 sm:px-4"
        }`}
      >
        {/* Header Row - Role, Timestamp, LLM Badge */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${isUser ? 'text-cyan-400' : 'text-purple-400'}`}>
              {isUser ? 'You' : 'Assistant'}
            </span>
            {timestamp && (
              <span 
                className="text-[10px] sm:text-xs text-gray-500 hover:text-gray-400 cursor-help transition-colors"
                title={formatFullDateTime(timestamp)}
              >
                {formatRelativeTime(timestamp)}
              </span>
            )}
          </div>
          
          {/* LLM Metadata Badge - inline on header */}
          {!isUser && llmMetadata && (
            <LLMBadge metadata={llmMetadata} />
          )}
        </div>

        {/* Message Content */}
        <div className="prose prose-invert max-w-none text-gray-100 leading-relaxed text-sm prose-pre:p-0 prose-pre:m-0 prose-pre:bg-transparent">
          <ReactMarkdown
            key={contentKey}
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
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
    </div>
  );
}
