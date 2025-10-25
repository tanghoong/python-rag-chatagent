"""
Message Complexity Analyzer

Analyzes user messages to determine complexity level and recommend appropriate LLM model.
"""

import re
from typing import Tuple, Dict
from enum import Enum


class ComplexityLevel(Enum):
    """Complexity levels for message analysis"""
    SIMPLE = "simple"          # Basic queries, greetings, simple facts
    MODERATE = "moderate"      # Standard questions, explanations
    COMPLEX = "complex"        # Multi-step reasoning, code generation, analysis
    EXPERT = "expert"          # Advanced reasoning, architecture design, debugging


class MessageComplexityAnalyzer:
    """
    Analyzes message complexity based on various heuristics.
    """

    # Keywords indicating different complexity levels
    SIMPLE_KEYWORDS = [
        "hello", "hi", "hey", "thanks", "thank you", "ok", "okay",
        "yes", "no", "what is", "who is", "when is", "where is"
    ]

    COMPLEX_KEYWORDS = [
        "explain", "compare", "analyze", "design", "architecture",
        "implement", "optimize", "refactor", "debug", "troubleshoot",
        "why does", "how can i", "what's the best way",
        "step by step", "walkthrough", "tutorial"
    ]

    EXPERT_KEYWORDS = [
        "system design", "scalability", "performance optimization",
        "distributed system", "microservices", "design pattern",
        "trade-off", "production", "enterprise", "best practice",
        "security vulnerability", "code review", "algorithm complexity"
    ]

    CODE_PATTERNS = [
        r"```[\s\S]*?```",           # Code blocks
        r"`[^`]+`",                   # Inline code
        r"function\s+\w+",            # Function declarations
        r"class\s+\w+",               # Class declarations
        r"def\s+\w+",                 # Python functions
        r"import\s+\w+",              # Imports
    ]

    @staticmethod
    def analyze(message: str) -> Tuple[ComplexityLevel, Dict[str, any]]:
        """
        Analyze message complexity and return level with metadata.

        Args:
            message: User message to analyze

        Returns:
            Tuple of (ComplexityLevel, metadata_dict)
        """
        message_lower = message.lower()
        word_count = len(message.split())
        sentence_count = len(re.split(r'[.!?]+', message))

        # Initialize scoring
        complexity_score = 0
        indicators = []

        # 1. Length-based scoring
        if word_count < 10:
            complexity_score += 0
        elif word_count < 30:
            complexity_score += 1
        elif word_count < 100:
            complexity_score += 2
        else:
            complexity_score += 3
            indicators.append(f"Long message ({word_count} words)")

        # 2. Question complexity
        question_words = ["how", "why", "what", "when", "where", "which", "who"]
        question_count = sum(1 for word in question_words if word in message_lower)
        if question_count > 2:
            complexity_score += 2
            indicators.append(f"Multiple questions ({question_count})")
        elif question_count > 0:
            complexity_score += 1

        # 3. Check for code-related content
        has_code = any(re.search(pattern, message) for pattern in MessageComplexityAnalyzer.CODE_PATTERNS)
        if has_code:
            complexity_score += 3
            indicators.append("Contains code")

        # 4. Keyword analysis
        simple_count = sum(1 for kw in MessageComplexityAnalyzer.SIMPLE_KEYWORDS if kw in message_lower)
        complex_count = sum(1 for kw in MessageComplexityAnalyzer.COMPLEX_KEYWORDS if kw in message_lower)
        expert_count = sum(1 for kw in MessageComplexityAnalyzer.EXPERT_KEYWORDS if kw in message_lower)

        if expert_count > 0:
            complexity_score += 4
            indicators.append(f"Expert keywords ({expert_count})")
        elif complex_count > 0:
            complexity_score += 2
            indicators.append(f"Complex keywords ({complex_count})")
        elif simple_count > 0:
            complexity_score -= 1

        # 5. Multi-part questions (numbered lists, bullet points)
        has_numbered_list = bool(re.search(r'\d+[\.)]\s', message))
        has_bullet_points = bool(re.search(r'[-*]\s', message))
        if has_numbered_list or has_bullet_points:
            complexity_score += 2
            indicators.append("Multi-part question")

        # 6. Technical terms (APIs, frameworks, databases)
        technical_terms = [
            "api", "database", "mongodb", "sql", "react", "python",
            "javascript", "typescript", "docker", "kubernetes", "aws",
            "azure", "framework", "library", "async", "await"
        ]
        tech_count = sum(1 for term in technical_terms if term in message_lower)
        if tech_count > 3:
            complexity_score += 2
            indicators.append(f"Technical terms ({tech_count})")
        elif tech_count > 0:
            complexity_score += 1

        # Determine complexity level based on score
        if complexity_score <= 2:
            level = ComplexityLevel.SIMPLE
        elif complexity_score <= 5:
            level = ComplexityLevel.MODERATE
        elif complexity_score <= 8:
            level = ComplexityLevel.COMPLEX
        else:
            level = ComplexityLevel.EXPERT

        metadata = {
            "score": complexity_score,
            "word_count": word_count,
            "sentence_count": sentence_count,
            "indicators": indicators,
            "has_code": has_code,
            "question_count": question_count
        }

        return level, metadata

    @staticmethod
    def recommend_model(complexity: ComplexityLevel, provider: str = "openai") -> str:
        """
        Recommend appropriate model based on complexity level.

        Args:
            complexity: ComplexityLevel enum
            provider: LLM provider ('openai' or 'google')

        Returns:
            str: Recommended model name
        """
        if provider == "openai":
            model_map = {
                ComplexityLevel.SIMPLE: "gpt-4o-mini",
                ComplexityLevel.MODERATE: "gpt-4o-mini",
                ComplexityLevel.COMPLEX: "gpt-4o",
                ComplexityLevel.EXPERT: "gpt-4o"
            }
        else:  # google
            model_map = {
                ComplexityLevel.SIMPLE: "gemini-2.0-flash-exp",
                ComplexityLevel.MODERATE: "gemini-2.0-flash-exp",
                ComplexityLevel.COMPLEX: "gemini-1.5-pro",
                ComplexityLevel.EXPERT: "gemini-1.5-pro"
            }

        return model_map.get(complexity, model_map[ComplexityLevel.MODERATE])


# Convenience function
def analyze_and_recommend(message: str, provider: str = "openai") -> Tuple[str, ComplexityLevel, Dict]:
    """
    Analyze message and recommend model in one call.

    Args:
        message: User message to analyze
        provider: LLM provider

    Returns:
        Tuple of (recommended_model, complexity_level, metadata)
    """
    analyzer = MessageComplexityAnalyzer()
    complexity, metadata = analyzer.analyze(message)
    recommended_model = analyzer.recommend_model(complexity, provider)

    return recommended_model, complexity, metadata


if __name__ == "__main__":
    # Test cases
    test_messages = [
        "Hello, how are you?",
        "What is Python?",
        "Explain how to implement a binary search tree with insertion and deletion methods",
        "Design a scalable microservices architecture for an e-commerce platform with high availability",
        "Can you help me debug this code: ```python\ndef calculate(x):\n    return x * 2\n```",
    ]

    print("=== Message Complexity Analysis ===\n")
    for msg in test_messages:
        model, complexity, metadata = analyze_and_recommend(msg, provider="openai")
        print(f"Message: {msg[:60]}...")
        print(f"Complexity: {complexity.value}")
        print(f"Recommended Model: {model}")
        print(f"Score: {metadata['score']}, Indicators: {metadata['indicators']}")
        print()
