/**
 * Memory Timeline Component
 * 
 * Visualizes memory creation and usage over time.
 */

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import { Calendar, TrendingUp, Database } from "lucide-react";

interface TimelineEntry {
  date: string;
  count: number;
  scope: string;
}

interface MemoryTimelineProps {
  chatId?: string;
  scope?: "global" | "chat" | "both";
}

export function MemoryTimeline({ chatId, scope = "both" }: Readonly<MemoryTimelineProps>) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTimeline();
  }, [chatId, scope]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE_URL}/api/memory/stats/${scope}`);
      if (chatId) url.searchParams.append("chat_id", chatId);

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "success") {
        // Transform stats into timeline entries
        const entries: TimelineEntry[] = Object.entries(data.stats.scopes).map(([scopeName, stats]: [string, any]) => ({
          date: new Date().toISOString().split("T")[0],
          count: stats.document_count,
          scope: scopeName,
        }));
        setTimeline(entries);
      }
    } catch (error) {
      console.error("Error loading timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-xl">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">No memory entries yet</p>
      </div>
    );
  }

  const maxCount = Math.max(...timeline.map(t => t.count));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">Memory Distribution</h3>
      </div>

      <div className="space-y-4">
        {timeline.map((entry, index) => {
          const percentage = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
          const isGlobal = entry.scope === "global_memory";

          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {isGlobal ? "🌐 Global Memory" : `💬 ${entry.scope}`}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {entry.count} {entry.count === 1 ? "document" : "documents"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isGlobal
                      ? "bg-gradient-to-r from-blue-500 to-blue-600"
                      : "bg-gradient-to-r from-purple-500 to-purple-600"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-indigo-600">
              {timeline.reduce((sum, t) => sum + t.count, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Documents</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {timeline.length}
            </p>
            <p className="text-sm text-gray-600">Memory Scopes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
