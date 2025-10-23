"""
LangChain Tools Module

Contains tools for the RAG chatbot agent, including MongoDB query tool.
"""

from typing import List, Dict, Any
from langchain.agents import tool
from database.connection import get_posts_collection


@tool
def post_data_from_db(query: str) -> str:
    """
    Retrieve personal blog posts or content from MongoDB database.
    
    Use this tool ONLY when the user explicitly asks about:
    - Personal posts, blog articles, or content
    - Their own writings or published content
    - Specific topics they've written about
    
    DO NOT use this tool for:
    - General knowledge questions
    - Current events or news
    - Mathematical calculations
    - General conversation
    
    Args:
        query: The search query to find relevant posts
    
    Returns:
        str: Formatted string with post information or error message
    """
    try:
        posts_collection = get_posts_collection()
        
        # Search for posts (simple text search on title and content)
        # For production, consider using MongoDB text indexes or vector search
        search_filter = {
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"content": {"$regex": query, "$options": "i"}},
                {"tags": {"$regex": query, "$options": "i"}}
            ]
        }
        
        posts = list(posts_collection.find(search_filter).limit(5))
        
        if not posts:
            return f"No posts found matching '{query}'. The database might be empty or no posts match your query."
        
        # Format posts for display
        result = f"Found {len(posts)} post(s) matching '{query}':\n\n"
        
        for i, post in enumerate(posts, 1):
            title = post.get('title', 'Untitled')
            content = post.get('content', 'No content')
            author = post.get('author', 'Unknown')
            date = post.get('date', 'Unknown date')
            tags = post.get('tags', [])
            
            # Truncate content if too long
            if len(content) > 200:
                content = content[:200] + "..."
            
            result += f"{i}. **{title}**\n"
            result += f"   Author: {author}\n"
            result += f"   Date: {date}\n"
            if tags:
                result += f"   Tags: {', '.join(tags)}\n"
            result += f"   Content: {content}\n\n"
        
        return result
        
    except Exception as e:
        error_msg = f"Error retrieving posts from database: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg


def get_all_tools() -> List:
    """
    Get list of all available tools for the agent.
    
    Returns:
        List: List of LangChain tools
    """
    return [post_data_from_db]


# For testing
if __name__ == "__main__":
    print("Testing post_data_from_db tool...")
    result = post_data_from_db.invoke({"query": "python"})
    print(result)
