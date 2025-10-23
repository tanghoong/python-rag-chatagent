"""
LangChain ReAct Agent Module

Implements a poetic AI assistant that responds in rhymes and intelligently uses tools.
"""

from typing import List, Dict, Tuple
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
2. Be smart about tool selection based on the question type:
   - post_data_from_db: Use ONLY for personal blog posts or content the user has written
   - web_search: Use for current events, news, recent information, or real-time data
   - wikipedia_search: Use for historical facts, biographies, scientific concepts, or encyclopedia knowledge
   - calculate: Use for mathematical calculations, expressions, or unit conversions
3. For general conversation or questions you can answer directly, skip tools and respond in rhyme
4. Keep your rhymes creative, engaging, and informative
5. Maximum 8 iterations - be efficient with tool usage
6. Use conversation history to maintain context and remember previous exchanges

{chat_history}

Tool Selection Examples:
- "What is Python?" → Answer directly in rhyme (general knowledge you know)
- "Show me my posts about AI" → Use post_data_from_db tool
- "What's the latest news on climate change?" → Use web_search tool
- "Tell me about Albert Einstein" → Use wikipedia_search tool
- "Calculate 15% of 200" → Use calculate tool
- "What is 2^10?" → Use calculate tool
- "Who won the Super Bowl this year?" → Use web_search tool (recent event)
- "Explain quantum physics" → Use wikipedia_search tool (scientific concept)

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
        return_intermediate_steps=True  # CHANGED: Return intermediate steps for thought process
    )
    
    return agent_executor


def get_agent_response(
    user_message: str, 
    chat_history: List[Dict[str, str]] | None = None
) -> Tuple[str, List[Dict[str, str]]]:
    """
    Get response from the agent for a user message with conversation history.
    
    Args:
        user_message: The user's input message
        chat_history: List of previous messages [{"role": "user"|"assistant", "content": "..."}]
    
    Returns:
        Tuple[str, List[Dict[str, str]]]: (response, thought_process)
            - response: The agent's final answer
            - thought_process: List of reasoning steps [{"step": "Thought|Action|Observation", "content": "..."}]
    """
    try:
        agent = create_chat_agent()
        
        # Format chat history for the prompt
        history_text = ""
        if chat_history and len(chat_history) > 0:
            history_text = "\nConversation History:\n"
            for msg in chat_history[-10:]:  # Last 10 messages for context
                role_label = "User" if msg["role"] == "user" else "Assistant"
                history_text += f"{role_label}: {msg['content']}\n"
            history_text += "\n"
        
        result = agent.invoke({
            "input": user_message,
            "chat_history": history_text
        })
        
        # Extract the output
        response = result.get("output", "I apologize, but I encountered an error processing your request.")
        
        # Extract thought process from intermediate steps
        thought_process = []
        intermediate_steps = result.get("intermediate_steps", [])
        
        for step_tuple in intermediate_steps:
            # Each step is a tuple: (AgentAction, observation)
            if len(step_tuple) >= 2:
                action, observation = step_tuple[0], step_tuple[1]
                
                # Add the thought/action
                thought_process.append({
                    "step": "Action",
                    "content": f"Tool: {action.tool}, Input: {action.tool_input}"
                })
                
                # Add the observation
                thought_process.append({
                    "step": "Observation",
                    "content": str(observation)[:500]  # Limit observation length
                })
        
        return response, thought_process
        
    except Exception as e:
        error_msg = f"An error occurred while processing your request: {str(e)}"
        print(f"❌ Agent Error: {error_msg}")
        
        # Return a poetic error message with empty thought process
        error_response = (
            "I'm sorry, dear friend, but something went wrong,\n"
            "An error occurred as I tried to respond along.\n"
            "Please try again with a different phrase,\n"
            "And I'll assist you in much better ways!"
        )
        
        return error_response, [{"step": "Error", "content": error_msg}]


# For testing
if __name__ == "__main__":
    print("Testing chat agent...")
    
    # Test 1: General question (no tool usage)
    print("\n--- Test 1: General Question ---")
    response1, steps1 = get_agent_response("What is Python?")
    print(f"Response: {response1}")
    print(f"Thought Process: {steps1}\n")
    
    # Test 2: Database query (tool usage)
    print("\n--- Test 2: Database Query ---")
    response2, steps2 = get_agent_response("Show me my posts about programming")
    print(f"Response: {response2}")
    print(f"Thought Process: {steps2}\n")
