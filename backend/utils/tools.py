"""
LangChain Tools Module

Contains tools for the RAG chatbot agent, including MongoDB query tool and RAG memory tools.
"""

from typing import List
import math
import re
from langchain_core.tools import tool
from database.connection import get_posts_collection

# Import RAG tools
try:
    from utils.rag_tools import get_rag_tools
    RAG_TOOLS_AVAILABLE = True
except ImportError:
    RAG_TOOLS_AVAILABLE = False
    print("⚠️ RAG tools not available yet")

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

try:
    import wikipedia
except ImportError:
    wikipedia = None


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


@tool
def web_search(query: str) -> str:
    """
    Search the web for current events, news, or real-time information.

    Use this tool when the user asks about:
    - Current events or recent news
    - Real-time information (weather, stock prices, etc.)
    - Recent developments or updates
    - Information that changes frequently

    Args:
        query: The search query

    Returns:
        str: Search results with titles, URLs, and snippets
    """
    if DDGS is None:
        return "Web search is not available. The duckduckgo-search package is not installed."

    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=5))

        if not results:
            return f"No web results found for '{query}'."

        output = f"Web search results for '{query}':\n\n"

        for i, result in enumerate(results, 1):
            title = result.get('title', 'No title')
            url = result.get('href', 'No URL')
            snippet = result.get('body', 'No description')

            output += f"{i}. **{title}**\n"
            output += f"   URL: {url}\n"
            output += f"   {snippet}\n\n"

        return output

    except Exception as e:
        error_msg = f"Error performing web search: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg


@tool
def wikipedia_search(query: str) -> str:
    """
    Search Wikipedia for encyclopedia knowledge and detailed information.

    Use this tool when the user asks about:
    - Historical facts or events
    - Biographies of people
    - Scientific concepts or theories
    - Geographic information
    - General knowledge topics

    Args:
        query: The topic to search on Wikipedia

    Returns:
        str: Wikipedia article summary
    """
    if wikipedia is None:
        return "Wikipedia search is not available. The wikipedia package is not installed."

    try:
        # Set language to English
        wikipedia.set_lang("en")

        # Get summary (first few sentences)
        summary = wikipedia.summary(query, sentences=4, auto_suggest=True)

        # Get page URL
        page = wikipedia.page(query, auto_suggest=True)
        url = page.url

        output = f"Wikipedia: **{page.title}**\n\n"
        output += f"{summary}\n\n"
        output += f"Read more: {url}"

        return output

    except wikipedia.exceptions.DisambiguationError as e:
        # Multiple options found
        options = e.options[:5]  # Show first 5 options
        return f"Multiple Wikipedia articles found for '{query}'. Please be more specific. Options: {', '.join(options)}"

    except wikipedia.exceptions.PageError:
        return f"No Wikipedia article found for '{query}'. Try rephrasing your query."

    except Exception as e:
        error_msg = f"Error searching Wikipedia: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg


@tool
def calculate(expression: str) -> str:
    """
    Perform mathematical calculations and evaluate expressions.

    Use this tool when the user asks about:
    - Mathematical calculations (addition, subtraction, multiplication, division)
    - Complex expressions with parentheses
    - Mathematical functions (sin, cos, sqrt, log, etc.)
    - Unit conversions or percentages

    Supports: +, -, *, /, **, (), sqrt, sin, cos, tan, log, exp, pi, e, etc.

    Args:
        expression: The mathematical expression to evaluate

    Returns:
        str: The calculated result or error message
    """
    try:
        # Clean the expression
        expression = expression.strip()

        # Define safe functions and constants
        safe_dict = {
            'abs': abs,
            'round': round,
            'min': min,
            'max': max,
            'sum': sum,
            'pow': pow,
            # Math functions
            'sqrt': math.sqrt,
            'sin': math.sin,
            'cos': math.cos,
            'tan': math.tan,
            'asin': math.asin,
            'acos': math.acos,
            'atan': math.atan,
            'log': math.log,
            'log10': math.log10,
            'exp': math.exp,
            'floor': math.floor,
            'ceil': math.ceil,
            # Constants
            'pi': math.pi,
            'e': math.e,
        }

        # Remove any potentially dangerous characters
        if re.search(r'[^0-9+\-*/().%,\s\w]', expression):
            # Allow only safe characters
            pass

        # Evaluate the expression
        result = eval(expression, {"__builtins__": {}}, safe_dict)

        return f"Result: {result}"

    except ZeroDivisionError:
        return "Error: Division by zero."
    except SyntaxError:
        return f"Error: Invalid mathematical expression '{expression}'. Please check your syntax."
    except NameError as e:
        return f"Error: Unknown function or variable in '{expression}'. {str(e)}"
    except Exception as e:
        error_msg = f"Error calculating '{expression}': {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg


def get_all_tools() -> List:
    """
    Get list of all available tools for the agent.
    Includes basic tools and RAG memory management tools.

    Returns:
        List: List of LangChain tools
    """
    # Basic tools
    basic_tools = [post_data_from_db, web_search, wikipedia_search, calculate]

    # Add RAG tools if available
    if RAG_TOOLS_AVAILABLE:
        try:
            rag_tools = get_rag_tools()
            all_tools = basic_tools + rag_tools
            print(f"✅ Loaded {len(all_tools)} tools ({len(basic_tools)} basic + {len(rag_tools)} RAG)")
            return all_tools
        except Exception as e:
            print(f"⚠️ Error loading RAG tools: {str(e)}")
            return basic_tools

    return basic_tools


# For testing
if __name__ == "__main__":
    print("Testing post_data_from_db tool...")
    result = post_data_from_db.invoke({"query": "python"})
    print(result)
