"""
Utility functions for generating chat titles using LLM
"""
from utils.llm import get_llm


async def generate_chat_title(first_message: str) -> str:
    """
    Generate a concise title from the first user message
    
    Args:
        first_message: The first message in the chat
    
    Returns:
        str: Generated title (max 50 characters)
    """
    try:
        llm = get_llm()
        
        prompt = f"""Based on this user's first message, generate a very short, concise title (maximum 5 words, no quotes or punctuation):

User message: "{first_message[:200]}"

Title:"""

        response = await llm.ainvoke(prompt)
        
        # Extract title and clean it up
        title = response.content.strip()
        
        # Remove quotes if present
        title = title.strip('"\'')
        
        # Truncate if too long
        if len(title) > 50:
            title = title[:47] + "..."
        
        return title if title else "New Chat"
        
    except Exception as e:
        print(f"Error generating chat title: {e}")
        return "New Chat"
