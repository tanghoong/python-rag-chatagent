"""
Token Counting Utilities

Provides functions to count tokens for various models and estimate costs.
"""

import tiktoken
from typing import List, Dict, Optional
from models.usage_models import TokenUsage


def count_tokens(text: str, model: str = "gpt-4") -> int:
    """
    Count tokens in a text string using tiktoken.
    
    Args:
        text: The text to count tokens for
        model: The model name (defaults to gpt-4 encoding which works well for Gemini)
    
    Returns:
        Number of tokens in the text
    """
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        # Fallback to cl100k_base encoding (used by GPT-4)
        encoding = tiktoken.get_encoding("cl100k_base")
    
    return len(encoding.encode(text))


def count_message_tokens(messages: List[Dict[str, str]], model: str = "gpt-4") -> int:
    """
    Count tokens in a list of chat messages.
    
    Args:
        messages: List of message dictionaries with 'role' and 'content' keys
        model: The model name
    
    Returns:
        Total number of tokens
    """
    total_tokens = 0
    
    for message in messages:
        # Count tokens for role
        total_tokens += count_tokens(message.get("role", ""), model)
        # Count tokens for content
        total_tokens += count_tokens(message.get("content", ""), model)
        # Add overhead for message formatting (approximately 4 tokens per message)
        total_tokens += 4
    
    return total_tokens


def create_token_usage(
    prompt_text: str = "",
    completion_text: str = "",
    prompt_messages: Optional[List[Dict[str, str]]] = None,
    model: str = "gpt-4"
) -> TokenUsage:
    """
    Create a TokenUsage object by counting tokens.
    
    Args:
        prompt_text: Direct prompt text (alternative to prompt_messages)
        completion_text: Generated completion text
        prompt_messages: List of chat messages for the prompt
        model: Model name for token counting
    
    Returns:
        TokenUsage object with counted tokens
    """
    prompt_tokens = 0
    
    if prompt_messages:
        prompt_tokens = count_message_tokens(prompt_messages, model)
    elif prompt_text:
        prompt_tokens = count_tokens(prompt_text, model)
    
    completion_tokens = count_tokens(completion_text, model) if completion_text else 0
    
    return TokenUsage(
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=prompt_tokens + completion_tokens
    )


def estimate_cost(token_usage: TokenUsage) -> float:
    """
    Estimate cost for token usage (convenience wrapper).
    
    Args:
        token_usage: TokenUsage object
    
    Returns:
        Estimated cost in USD
    """
    return token_usage.estimated_cost
