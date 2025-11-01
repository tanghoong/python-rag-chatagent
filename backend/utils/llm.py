"""
Multi-Provider LLM Configuration Module

Supports multiple LLM providers: Google Gemini and OpenAI.
Provider selection via LLM_PROVIDER environment variable.
Includes intelligent auto-switching based on message complexity.
"""

import os
from typing import Union, Optional, Tuple
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()

# Get configuration from environment
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()  # Default to OpenAI for auto-switching
AUTO_SWITCH_LLM = os.getenv("AUTO_SWITCH_LLM", "true").lower() == "true"  # Enable auto-switching by default
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Validate API keys based on selected provider
if LLM_PROVIDER == "google" and not GOOGLE_API_KEY:
    raise ValueError(
        "GOOGLE_API_KEY not found in environment variables. "
        "Please set it in your .env file or change LLM_PROVIDER."
    )
elif LLM_PROVIDER == "openai" and not OPENAI_API_KEY:
    raise ValueError(
        "OPENAI_API_KEY not found in environment variables. "
        "Please set it in your .env file or change LLM_PROVIDER."
    )


def get_llm(
    temperature: float = 0.2,
    model: Optional[str] = None,
    provider: Optional[str] = None
) -> Union[ChatGoogleGenerativeAI, ChatOpenAI]:
    """
    Get configured LLM instance based on provider.

    Args:
        temperature: Sampling temperature (0.0-1.0). Lower is more deterministic.
        model: Model name to use. If None, uses default for the provider.
        provider: LLM provider ('google' or 'openai'). If None, uses LLM_PROVIDER env var.

    Returns:
        Union[ChatGoogleGenerativeAI, ChatOpenAI]: Configured LLM instance

    Raises:
        ValueError: If provider is not supported or API key is missing
    """
    # Use provider from parameter or environment variable
    selected_provider = (provider or LLM_PROVIDER).lower()

    if selected_provider == "google":
        # Default Google Gemini model
        default_model = "gemini-2.0-flash-exp"
        model_name = model or default_model

        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=GOOGLE_API_KEY,
            temperature=temperature,
            convert_system_message_to_human=True,  # For better compatibility
        )

        return llm

    elif selected_provider == "openai":
        # Default OpenAI model
        default_model = "gpt-4o-mini"
        model_name = model or default_model

        llm = ChatOpenAI(
            model=model_name,
            openai_api_key=OPENAI_API_KEY,
            temperature=temperature,
        )

        return llm

    else:
        raise ValueError(
            f"Unsupported LLM provider: {selected_provider}. "
            "Supported providers: 'google', 'openai'"
        )


def get_smart_llm(
    message: str,
    temperature: float = 0.2,
    provider: Optional[str] = None,
    force_model: Optional[str] = None
) -> Tuple[Union[ChatGoogleGenerativeAI, ChatOpenAI], dict]:
    """
    Get LLM instance with automatic model selection based on message complexity.

    This function analyzes the input message and automatically selects the most
    appropriate model based on complexity:
    - Simple queries -> gpt-4o-mini / gemini-2.0-flash-exp (fast & cost-effective)
    - Complex queries -> gpt-4o / gemini-1.5-pro (higher quality)

    Args:
        message: User message to analyze for complexity
        temperature: Sampling temperature (0.0-1.0)
        provider: LLM provider ('google' or 'openai'). If None, uses LLM_PROVIDER env var
        force_model: Force a specific model (overrides auto-selection)

    Returns:
        Tuple of (LLM instance, metadata dict with complexity info)
    """
    from utils.complexity_analyzer import analyze_and_recommend

    selected_provider = (provider or LLM_PROVIDER).lower()

    # If auto-switching is disabled or model is forced, use standard get_llm
    if not AUTO_SWITCH_LLM or force_model:
        model = force_model or ("gpt-4o-mini" if selected_provider == "openai" else "gemini-2.0-flash-exp")
        llm = get_llm(temperature=temperature, model=model, provider=selected_provider)
        metadata = {
            "auto_switched": False,
            "model": model,
            "provider": selected_provider,
            "complexity": "not_analyzed"
        }
        return llm, metadata

    # Analyze message complexity and get recommendation
    recommended_model, complexity, analysis_metadata = analyze_and_recommend(message, provider=selected_provider)

    # Get LLM with recommended model
    llm = get_llm(temperature=temperature, model=recommended_model, provider=selected_provider)

    # Prepare metadata
    metadata = {
        "auto_switched": True,
        "model": recommended_model,
        "provider": selected_provider,
        "complexity": complexity.value,
        "complexity_score": analysis_metadata["score"],
        "indicators": analysis_metadata["indicators"],
        "word_count": analysis_metadata["word_count"]
    }

    print(
        f"🧠 Smart LLM Selection: {recommended_model} (complexity: {
            complexity.value}, score: {
            analysis_metadata['score']})")

    return llm, metadata


# Create default LLM instance
llm = get_llm()


# Test function
def test_llm():
    """
    Test LLM connection with a simple query.
    """
    try:
        test_llm_instance = get_llm()
        response = test_llm_instance.invoke("Say 'Hello, I am working!' in one short sentence.")
        print(f"✅ LLM Test Response ({LLM_PROVIDER}): {response.content}")
        return True
    except Exception as e:
        print(f"❌ LLM Test Failed: {str(e)}")
        return False


def test_smart_llm():
    """
    Test smart LLM selection with different complexity messages.
    """
    test_messages = [
        "Hello!",
        "What is Python?",
        "Design a scalable microservices architecture for e-commerce",
    ]

    print("\n=== Testing Smart LLM Selection ===\n")
    for msg in test_messages:
        try:
            _, metadata = get_smart_llm(msg)
            print(f"Message: {msg[:50]}...")
            print(f"Selected Model: {metadata['model']}")
            print(f"Complexity: {metadata['complexity']}")
            print(f"Metadata: {metadata}\n")
        except Exception as e:
            print(f"❌ Test failed for message: {msg[:50]}... - Error: {str(e)}\n")

    print("\n=== Testing Smart LLM Selection with Google Provider ===\n")
    for msg in test_messages:
        try:
            _, metadata = get_smart_llm(msg, provider="google")
            print(f"Message: {msg[:50]}...")
            print(f"Selected Model: {metadata['model']}")
            print(f"Complexity: {metadata['complexity']}")
            print(f"Metadata: {metadata}\n")
        except Exception as e:
            print(f"❌ Test failed for message: {msg[:50]}... - Error: {str(e)}\n")


if __name__ == "__main__":
    print("Testing LLM connection...")
    test_llm()

    if AUTO_SWITCH_LLM:
        test_smart_llm()
