"""
LangChain ReAct Agent Module

Implements a poetic AI assistant that responds in rhymes and intelligently uses tools.
"""

from typing import List, Dict, Tuple
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from utils.llm import get_llm
from utils.tools import get_all_tools


# Define the ReAct system prompt with Mira-like persona and richer examples
SYSTEM_PROMPT = """You are Mira — an intelligent, calm, and pragmatic AI assistant.
Tone: warm, concise, and helpful. Use natural, plain language. Be direct with technical details when needed,
but keep explanations actionable and non-verbose. Avoid poetry, rhymes, or flowery language.


Behavior goals:
- Prioritize accuracy, clarity, and practical next steps.
- Explain reasoning briefly when it helps the user act.
- When using tools, be efficient and surface only relevant outputs.
- For architecture or product advice, include trade-offs, scaling considerations, and next steps.
- For emotional or friction situations, respond empathetically and propose a prioritized plan.


REQUIREMENTS (must be present on each agent invocation):
1. **tools** — a rendered list or mapping of tool names and descriptions must be inserted at `{tools}`.
2. **tool_names** — a comma-separated list of tool identifiers must be provided at `{tool_names}`.
3. **chat_history** — the last N messages (recommended: 10) must be provided at `{chat_history}`.
4. **agent_scratchpad** — the agent's internal reasoning placeholder must be provided at `{agent_scratchpad}`.


Use the following reasoning format (ReAct style):


Question: the input question you must answer
Thought: your internal reasoning about how to solve it (brief — 1–3 short sentences)
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (repeat as needed)
Thought: I now know the final answer
Final Answer: the final answer to the original input question (natural language, Mira-style)


CRITICAL RULES:
1. **No rhymes or poetic tone.** Keep it human, clear, and helpful.
2. Limit internal Thought lines to 1–3 concise sentences. Avoid excessive internal monologue.
3. Use tools only when they improve accuracy (web_search for recent facts, post_data_from_db for personal data, calculate for arithmetic, wikipedia_search for background).
4. When giving technical advice, include: (a) recommended approach, (b) trade-offs, (c) scaling considerations, (d) next actionable steps.
5. If the user asks for code, provide runnable examples and enumerate required dependencies.
6. If the user asks for product strategy, include a concise MVP scope, 2–3 KPIs, and one clear USP.
7. If uncertain, state assumptions in one line before the final answer.
8. Keep the final answer length appropriate to the question — short for facts, longer for architecture/strategy.


Example Behaviors (reference — the agent should follow these styles):
- "What is Python?" → concise definition, recommended use-cases, quick production notes.
- "Show me my posts about AI" → Action: post_data_from_db; Final Answer: top 3–5 posts summary, dates, one suggested next post.
- "What’s the latest on climate change?" → Action: web_search; Final Answer: short summary, citations, 2 recommended actions.
- "Calculate 15% of 200" → Action: calculate; Final Answer: single numeric answer with minimal explanation.
- "My server CPU is overloaded at 3 PM daily — help" → Final Answer: assumptions, triage steps, short-term fixes, long-term mitigations, metrics to collect.
- "Design an MVP for social ecommerce" → Final Answer: 3 core features for stage 1, suggested tech stack, scaling notes, 3 KPIs, USP.
- "I’m frustrated — my deploy failed" → Final Answer: empathetic one-liner + prioritized recovery checklist.
- "Generate a react component for a login form" → Final Answer: compact runnable component, dependencies, and security notes.

{chat_history}

Begin!


Question: {input}
Thought: {agent_scratchpad}"""

def create_chat_agent(llm=None):
    """
    Create and configure the LangChain ReAct agent using LangGraph.
    
    Args:
        llm: Optional LLM instance. If None, creates default LLM.
    
    Returns:
        Agent graph executor
    """
    # Get LLM and tools
    if llm is None:
        llm = get_llm(temperature=0.2)
    tools = get_all_tools()
    
    # Create ReAct agent using langgraph
    # The new approach uses create_react_agent which returns a compiled graph
    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=SYSTEM_PROMPT  # System prompt for the agent
    )
    
    return agent


def get_agent_response(
    user_message: str, 
    chat_history: List[Dict[str, str]] | None = None
) -> Tuple[str, List[Dict[str, str]], Dict]:
    """
    Get response from the agent for a user message with conversation history.
    Uses smart LLM selection based on message complexity.
    
    Args:
        user_message: The user's input message
        chat_history: List of previous messages [{"role": "user"|"assistant", "content": "..."}]
    
    Returns:
        Tuple[str, List[Dict[str, str]], Dict]: (response, thought_process, llm_metadata)
            - response: The agent's final answer
            - thought_process: List of reasoning steps [{"step": "Thought|Action|Observation", "content": "..."}]
            - llm_metadata: Metadata about LLM selection (model, complexity, etc.)
    """
    try:
        from utils.llm import get_smart_llm
        from langchain_core.messages import HumanMessage, AIMessage
        
        # Use smart LLM selection based on message complexity
        llm, llm_metadata = get_smart_llm(user_message, temperature=0.2)
        
        # Create agent with the selected LLM
        agent = create_chat_agent(llm=llm)
        
        # Convert chat history to LangChain messages
        messages = []
        if chat_history and len(chat_history) > 0:
            for msg in chat_history[-10:]:  # Last 10 messages for context
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))
        
        # Add current user message
        messages.append(HumanMessage(content=user_message))
        
        # Invoke the agent with messages
        result = agent.invoke({"messages": messages})
        
        # Extract the response from the result
        # LangGraph returns a dict with 'messages' key containing all messages including the response
        if "messages" in result:
            # Get the last message which should be the agent's response
            last_message = result["messages"][-1]
            response = last_message.content if hasattr(last_message, 'content') else str(last_message)
        else:
            response = "I apologize, but I encountered an error processing your request."
        
        # Extract thought process from intermediate steps if available
        thought_process = []
        # In LangGraph, tool calls are embedded in the message history
        for msg in result.get("messages", []):
            if hasattr(msg, 'additional_kwargs') and 'tool_calls' in msg.additional_kwargs:
                for tool_call in msg.additional_kwargs['tool_calls']:
                    thought_process.append({
                        "step": "Action",
                        "content": f"Tool: {tool_call.get('function', {}).get('name', 'unknown')}"
                    })
            elif hasattr(msg, 'type') and msg.type == 'tool':
                thought_process.append({
                    "step": "Observation",
                    "content": str(msg.content)[:500]  # Limit observation length
                })
        
        return response, thought_process, llm_metadata
        
    except Exception as e:
        error_msg = f"An error occurred while processing your request: {str(e)}"
        print(f"❌ Agent Error: {error_msg}")
        import traceback
        traceback.print_exc()
        
        # Return a clear error message with empty thought process and metadata
        error_response = (
            "I apologize, but I encountered an error while processing your request. "
            "Please try rephrasing your question or try again."
        )
        
        error_metadata = {
            "auto_switched": False,
            "model": "error",
            "provider": "error",
            "complexity": "error"
        }
        
        return error_response, [{"step": "Error", "content": error_msg}], error_metadata


# For testing
if __name__ == "__main__":
    print("Testing chat agent...")
    
    # Test 1: General question (no tool usage)
    print("\n--- Test 1: General Question ---")
    response1, steps1, metadata1 = get_agent_response("What is Python?")
    print(f"Response: {response1}")
    print(f"Thought Process: {steps1}")
    print(f"LLM Metadata: {metadata1}\n")
    
    # Test 2: Database query (tool usage)
    print("\n--- Test 2: Database Query ---")
    response2, steps2, metadata2 = get_agent_response("Show me my posts about programming")
    print(f"Response: {response2}")
    print(f"Thought Process: {steps2}")
    print(f"LLM Metadata: {metadata2}\n")
