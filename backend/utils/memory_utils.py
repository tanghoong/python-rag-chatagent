"""
Memory ID Utilities

Utilities for generating and managing unique memory IDs.
"""

import hashlib
from datetime import datetime
from typing import Optional


def generate_memory_id(content: str, timestamp: Optional[str] = None) -> str:
    """
    Generate a unique memory ID from content and timestamp.

    Args:
        content: Memory content
        timestamp: Optional ISO format timestamp, uses current time if not provided

    Returns:
        Unique memory ID in format: mem_<hash>
    """
    ts = timestamp or datetime.now().isoformat()
    # Use first 100 chars of content + timestamp for uniqueness
    data = f"{content[:100]}{ts}".encode('utf-8')
    hash_value = hashlib.md5(data).hexdigest()[:16]
    return f"mem_{hash_value}"


def validate_memory_content(content: str, min_length: int = 1, max_length: int = 10000) -> tuple[bool, str]:
    """
    Validate memory content.

    Args:
        content: Memory content to validate
        min_length: Minimum content length
        max_length: Maximum content length

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not content or not content.strip():
        return False, "Content cannot be empty"

    if len(content) < min_length:
        return False, f"Content must be at least {min_length} characters"

    if len(content) > max_length:
        return False, f"Content cannot exceed {max_length} characters"

    return True, ""


def extract_tags_from_content(content: str) -> list[str]:
    """
    Extract potential tags from content using simple heuristics.

    Args:
        content: Memory content

    Returns:
        List of suggested tags
    """
    # Simple tag extraction based on common patterns
    # This can be enhanced with NLP or ML models
    tags = []

    # Look for hashtags
    import re
    hashtags = re.findall(r'#(\w+)', content)
    tags.extend(hashtags)

    # Look for common programming languages
    languages = ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'sql']
    content_lower = content.lower()
    for lang in languages:
        if lang in content_lower:
            tags.append(lang)

    # Look for common topics
    topics = ['ai', 'ml', 'machine learning', 'deep learning', 'data science',
              'web', 'api', 'database', 'frontend', 'backend']
    for topic in topics:
        if topic in content_lower:
            tags.append(topic.replace(' ', '-'))

    # Remove duplicates and return
    return list(set(tags))
