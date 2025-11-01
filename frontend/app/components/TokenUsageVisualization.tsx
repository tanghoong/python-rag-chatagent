import React, { useState, useEffect } from 'react';
import { Activity, DollarSign, Clock, Zap, TrendingUp, Bot, User } from 'lucide-react';

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
}

interface ToolUsage {
  tool_name: string;
  call_count: number;
  success_count: number;
  failure_count: number;
  total_duration_ms: number;
  average_duration_ms: number;
  success_rate: number;
}

interface MessageStats {
  message_id: string;
  token_usage: TokenUsage;
  tool_calls: ToolUsage[];
  duration_ms: number;
  timestamp: string;
}

interface ChatSessionStats {
  chat_id: string;
  total_messages: number;
  total_tokens: TokenUsage;
  tool_usage_summary: ToolUsage[];
  average_response_time_ms: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

interface UsageStatsResponse {
  chat_id: string;
  session_stats: ChatSessionStats;
  recent_messages: MessageStats[];
  breakdown: {
    average_tokens_per_message: number;
    average_cost_per_message: number;
    tool_usage_count: number;
  };
}

interface TokenUsageVisualizationProps {
  chatId: string | null;
  isVisible?: boolean;
  className?: string;
}

export function TokenUsageVisualization({ 
  chatId, 
  isVisible = true,
  className = '' 
}: Readonly<TokenUsageVisualizationProps>) {
  const [stats, setStats] = useState<UsageStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId || !isVisible) {
      return;
    }

    const fetchUsageStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/chats/${chatId}/stats`);
        if (!response.ok) {
          throw new Error('Failed to fetch usage statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching usage stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageStats();
  }, [chatId, isVisible]);

  if (!isVisible || !chatId) {
    return null;
  }

  if (loading) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-purple-400 animate-spin" />
          <span className="text-sm text-gray-400">Loading usage statistics...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">
            {error || 'No usage statistics available'}
          </span>
        </div>
      </div>
    );
  }

  const { session_stats, breakdown } = stats;

  const formatCost = (cost: number) => {
    if (cost < 0.001) return `<$0.001`;
    return `$${cost.toFixed(4)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={`bg-white/5 border border-white/10 rounded-lg p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          Token Usage Statistics
        </h3>
        <span className="text-xs text-gray-400">
          {session_stats.total_messages} messages
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-400 font-medium">Total Tokens</div>
              <div className="text-sm font-bold text-white">
                {formatNumber(session_stats.total_tokens.total_tokens)}
              </div>
            </div>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-green-400 font-medium">Total Cost</div>
              <div className="text-sm font-bold text-white">
                {formatCost(session_stats.total_cost)}
              </div>
            </div>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-400 font-medium">Avg Response</div>
              <div className="text-sm font-bold text-white">
                {Math.round(session_stats.average_response_time_ms)}ms
              </div>
            </div>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-cyan-400 font-medium">Avg/Message</div>
              <div className="text-sm font-bold text-white">
                {Math.round(breakdown.average_tokens_per_message)}
              </div>
            </div>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Token Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-300">Token Distribution</h4>
        <div className="flex items-center space-x-4">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-blue-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                Input ({session_stats.total_tokens.prompt_tokens})
              </span>
              <span className="text-blue-400">
                {((session_stats.total_tokens.prompt_tokens / session_stats.total_tokens.total_tokens) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(session_stats.total_tokens.prompt_tokens / session_stats.total_tokens.total_tokens) * 100}%` 
                }}
              />
            </div>
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-purple-400 flex items-center gap-1">
                <Bot className="w-3 h-3" />
                Output ({session_stats.total_tokens.completion_tokens})
              </span>
              <span className="text-purple-400">
                {((session_stats.total_tokens.completion_tokens / session_stats.total_tokens.total_tokens) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(session_stats.total_tokens.completion_tokens / session_stats.total_tokens.total_tokens) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tool Usage Summary */}
      {session_stats.tool_usage_summary.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-300">Tool Usage</h4>
          <div className="space-y-1">
            {session_stats.tool_usage_summary.slice(0, 3).map((tool, index) => (
              <div key={tool.tool_name} className="flex justify-between items-center text-xs">
                <span className="text-gray-400">{tool.tool_name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">{tool.call_count} calls</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    tool.success_rate >= 90 ? 'bg-green-500/20 text-green-400' :
                    tool.success_rate >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {tool.success_rate.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
            {session_stats.tool_usage_summary.length > 3 && (
              <div className="text-xs text-gray-500 text-center pt-1">
                +{session_stats.tool_usage_summary.length - 3} more tools
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenUsageVisualization;