/**
 * Memory Source Badge Component
 * 
 * Displays badges indicating which memory sources were used in a response.
 */

import { Globe, MessageSquare } from "lucide-react";

interface MemorySource {
  type: "global" | "chat";
  count: number;
}

interface MemorySourceBadgeProps {
  sources?: MemorySource[];
}

export function MemorySourceBadge({ sources }: Readonly<MemorySourceBadgeProps>) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 mt-2 flex-wrap">
      {sources.map((source) => (
        <div
          key={source.type}
          className={`
            inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
            ${
              source.type === "global"
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-purple-100 text-purple-700 border border-purple-300"
            }
          `}
        >
          {source.type === "global" ? (
            <Globe className="w-3 h-3" />
          ) : (
            <MessageSquare className="w-3 h-3" />
          )}
          <span>
            {source.type === "global" ? "Global" : "Chat"} ({source.count})
          </span>
        </div>
      ))}
    </div>
  );
}
