"""
Google Gemini LLM Configuration Module

Configures and provides access to Google Gemini 2.0 Flash model.
"""

import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables
load_dotenv()

# Get Google API key from environment
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError(
        "GOOGLE_API_KEY not found in environment variables. "
        "Please set it in your .env file."
    )


def get_llm(temperature: float = 0.2, model: str = "gemini-2.0-flash-exp") -> ChatGoogleGenerativeAI:
    """
    Get configured Google Gemini LLM instance.
    
    Args:
        temperature: Sampling temperature (0.0-1.0). Lower is more deterministic.
        model: Model name to use. Default is gemini-2.0-flash-exp.
    
    Returns:
        ChatGoogleGenerativeAI: Configured LLM instance
    """
    llm = ChatGoogleGenerativeAI(
        model=model,
        google_api_key=GOOGLE_API_KEY,
        temperature=temperature,
        convert_system_message_to_human=True,  # For better compatibility
    )
    
    return llm


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
        print(f"✅ LLM Test Response: {response.content}")
        return True
    except Exception as e:
        print(f"❌ LLM Test Failed: {str(e)}")
        return False


if __name__ == "__main__":
    print("Testing Google Gemini LLM connection...")
    test_llm()
