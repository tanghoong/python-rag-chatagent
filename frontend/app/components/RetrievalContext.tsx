import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Database, ThumbsUp, ThumbsDown } from "lucide-react";

interface RetrievedChunk {
  content: string;
  relevance_score: number;
  source: string;
  metadata?: Record<string, any>;
  chunk_id?: string;
}

interface RetrievalContextData {
  chunks: RetrievedChunk[];
  search_queries: string[];
  search_strategies: string[];
  total_searches: number;
  unique_sources: string[];
  total_chunks: number;
  timestamp?: string;
}

interface RetrievalContextProps {
  context: RetrievalContextData;
  messageId?: string;
  onFeedback?: (chunkId: string, helpful: boolean) => void;
}

export function RetrievalContext({ context, messageId, onFeedback }: Readonly<RetrievalContextProps>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<number | null>(null);

  if (!context || context.total_chunks === 0) {
    return null;
  }

  const getSourceIcon = (source: string) => {
    if (source.includes("global_memory") || source.includes("chat_")) {
      return <Database className="w-3.5 h-3.5" />;
    }
    return <FileText className="w-3.5 h-3.5" />;
  };

  const getSourceLabel = (source: string) => {
    if (source === "global_memory") return "Global Memory";
    if (source.startsWith("chat_")) return "Chat Memory";
    return source;
  };

  const formatScore = (score: number) => {
    if (score === 0) return "N/A";
    return (1 - score).toFixed(3); // Convert distance to similarity
  };

  return (
    <div className="mt-3 border border-purple-500/30 rounded-lg overflow-hidden bg-gray-800/40">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-purple-500/10 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm">
          <Database className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 font-medium">
            Retrieved Context
          </span>
          <span className="text-gray-400">
            ({context.total_chunks} {context.total_chunks === 1 ? "chunk" : "chunks"} from {context.unique_sources.length} {context.unique_sources.length === 1 ? "source" : "sources"})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-purple-500/30 p-3 space-y-3">
          {/* Search Info */}
          {context.search_queries.length > 0 && (
            <div className="text-xs text-gray-400 space-y-1">
              <div>
                <span className="text-purple-300">Queries:</span> {context.search_queries.join(", ")}
              </div>
              <div>
                <span className="text-purple-300">Strategies:</span> {context.search_strategies.join(", ")}
              </div>
            </div>
          )}

          {/* Chunks List */}
          <div className="space-y-2">
            {context.chunks.map((chunk, index) => {
              const chunkKey = chunk.chunk_id || `chunk-${index}`;
              return (
                <div
                  key={chunkKey}
                  className="border border-gray-700 rounded-md overflow-hidden bg-gray-900/50"
                >
                {/* Chunk Header */}
                <button
                  onClick={() => setSelectedChunk(selectedChunk === index ? null : index)}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-cyan-400 shrink-0">
                      {getSourceIcon(chunk.source)}
                      <span className="text-xs font-medium">
                        {getSourceLabel(chunk.source)}
                      </span>
                    </div>
                    <div className="h-4 w-px bg-gray-700 shrink-0" />
                    <span className="text-xs text-emerald-400 shrink-0">
                      Score: {formatScore(chunk.relevance_score)}
                    </span>
                    {chunk.metadata?.filename && (
                      <>
                        <div className="h-4 w-px bg-gray-700 shrink-0" />
                        <span className="text-xs text-gray-400 truncate">
                          {chunk.metadata.filename}
                        </span>
                      </>
                    )}
                  </div>
                  {selectedChunk === index ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}
                </button>

                {/* Chunk Content */}
                {selectedChunk === index && (
                  <div className="border-t border-gray-700 p-3 space-y-2">
                    <div className="text-xs text-gray-300 leading-relaxed max-h-40 overflow-y-auto code-scroll">
                      {chunk.content}
                    </div>

                    {/* Metadata */}
                    {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
                        <div className="font-medium text-gray-400 mb-1">Metadata:</div>
                        <div className="space-y-0.5">
                          {Object.entries(chunk.metadata).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-gray-500">{key}:</span>
                              <span className="text-gray-400">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback Buttons */}
                    {onFeedback && chunk.chunk_id && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                        <span className="text-xs text-gray-400">Was this helpful?</span>
                        <button
                          onClick={() => onFeedback(chunk.chunk_id!, true)}
                          className="p-1.5 rounded hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 transition-colors"
                          title="Helpful"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onFeedback(chunk.chunk_id!, false)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
