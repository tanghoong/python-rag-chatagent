"""
Usage Statistics and Analytics Models

Tracks token usage, costs, tool usage, and performance metrics for chat sessions.
"""

from typing import List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class TokenUsage(BaseModel):
    """Token usage tracking for a single message or session."""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    @property
    def estimated_cost(self) -> float:
        """
        Estimate cost based on Gemini pricing.
        Gemini 2.0 Flash: ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens
        """
        input_cost = (self.prompt_tokens / 1_000_000) * 0.075
        output_cost = (self.completion_tokens / 1_000_000) * 0.30
        return round(input_cost + output_cost, 6)


class ToolUsage(BaseModel):
    """Track tool usage for analytics."""
    tool_name: str
    call_count: int = 0
    success_count: int = 0
    failure_count: int = 0
    total_duration_ms: float = 0.0

    @property
    def average_duration_ms(self) -> float:
        """Calculate average duration per tool call."""
        if self.call_count == 0:
            return 0.0
        return round(self.total_duration_ms / self.call_count, 2)

    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.call_count == 0:
            return 0.0
        return round((self.success_count / self.call_count) * 100, 2)


class MessageStats(BaseModel):
    """Statistics for a single message."""
    message_id: str
    token_usage: TokenUsage
    tool_calls: List[ToolUsage] = []
    duration_ms: float = 0.0
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    thought_process: List[Dict[str, str]] = []  # Agent reasoning steps


class ChatSessionStats(BaseModel):
    """Aggregated statistics for an entire chat session."""
    chat_id: str
    total_messages: int = 0
    total_tokens: TokenUsage = Field(default_factory=TokenUsage)
    tool_usage_summary: List[ToolUsage] = []
    average_response_time_ms: float = 0.0
    total_cost: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def add_message_stats(self, message_stats: MessageStats):
        """Update session stats with new message statistics."""
        # Update token counts
        self.total_tokens.prompt_tokens += message_stats.token_usage.prompt_tokens
        self.total_tokens.completion_tokens += message_stats.token_usage.completion_tokens
        self.total_tokens.total_tokens += message_stats.token_usage.total_tokens

        # Update message count and response time
        self.total_messages += 1
        current_total = self.average_response_time_ms * (self.total_messages - 1)
        self.average_response_time_ms = (current_total + message_stats.duration_ms) / self.total_messages

        # Update tool usage
        for tool_call in message_stats.tool_calls:
            existing_tool = next(
                (t for t in self.tool_usage_summary if t.tool_name == tool_call.tool_name),
                None
            )
            if existing_tool:
                existing_tool.call_count += tool_call.call_count
                existing_tool.success_count += tool_call.success_count
                existing_tool.failure_count += tool_call.failure_count
                existing_tool.total_duration_ms += tool_call.total_duration_ms
            else:
                self.tool_usage_summary.append(tool_call)

        # Update total cost
        self.total_cost = self.total_tokens.estimated_cost
        self.updated_at = datetime.now(timezone.utc)


class UsageStatsResponse(BaseModel):
    """API response model for usage statistics."""
    chat_id: str
    session_stats: ChatSessionStats
    recent_messages: List[MessageStats] = []  # Last 10 messages
    breakdown: Dict[str, Any] = {}  # Additional breakdown data
