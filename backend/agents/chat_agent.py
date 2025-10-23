"""
LangChain ReAct Agent Module

Implements a poetic AI assistant that responds in rhymes and intelligently uses tools.
"""

from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.prompts import PromptTemplate
from utils.llm import get_llm
from utils.tools import get_all_tools


# Define the ReAct prompt template with poetic persona
REACT_PROMPT = """You are a wise and poetic AI assistant who ALWAYS responds in rhymes.
Your personality is creative, helpful, and articulate. You speak like a mystical poet.

You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question (MUST be in rhyme form)

CRITICAL RULES:
1. Your Final Answer MUST ALWAYS be in rhyming verse (poetic rhymes)
2. Only use tools when the user asks about their personal posts/content
3. For general questions, skip tools and answer directly in rhyme
4. Keep your rhymes creative, engaging, and informative
5. Maximum 8 iterations - be efficient with tool usage

Examples:
- "What is Python?" → Answer directly in rhyme (NO tool usage)
- "Show me my posts about AI" → Use post_data_from_db tool, then respond in rhyme
- "Tell me a joke" → Answer directly in rhyme (NO tool usage)
- "What are my blog posts?" → Use post_data_from_db tool, then respond in rhyme

Begin!

Question: {input}
Thought: {agent_scratchpad}"""


def create_chat_agent() -> AgentExecutor:
    """
    Create and configure the LangChain ReAct agent.
    
    Returns:
        AgentExecutor: Configured agent executor
    """
    # Get LLM and tools
    llm = get_llm(temperature=0.2)
    tools = get_all_tools()
    
    # Create prompt template
    prompt = PromptTemplate.from_template(REACT_PROMPT)
    
    # Create ReAct agent
    agent = create_react_agent(
        llm=llm,
        tools=tools,
        prompt=prompt
    )
    
    # Create agent executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,  # Enable verbose logging for debugging
        max_iterations=8,
        handle_parsing_errors=True,
        return_intermediate_steps=False
    )
    
    return agent_executor


def get_agent_response(user_message: str) -> str:
    """
    Get response from the agent for a user message.
    
    Args:
        user_message: The user's input message
    
    Returns:
        str: The agent's response (in rhyme)
    """
    try:
        agent = create_chat_agent()
        result = agent.invoke({"input": user_message})
        
        # Extract the output
        response = result.get("output", "I apologize, but I encountered an error processing your request.")
        
        return response
        
    except Exception as e:
        error_msg = f"An error occurred while processing your request: {str(e)}"
        print(f"❌ Agent Error: {error_msg}")
        
        # Return a poetic error message
        return (
            "I'm sorry, dear friend, but something went wrong,\n"
            "An error occurred as I tried to respond along.\n"
            "Please try again with a different phrase,\n"
            "And I'll assist you in much better ways!"
        )


# For testing
if __name__ == "__main__":
    print("Testing chat agent...")
    
    # Test 1: General question (no tool usage)
    print("\n--- Test 1: General Question ---")
    response1 = get_agent_response("What is Python?")
    print(f"Response: {response1}\n")
    
    # Test 2: Database query (tool usage)
    print("\n--- Test 2: Database Query ---")
    response2 = get_agent_response("Show me my posts about programming")
    print(f"Response: {response2}\n")
