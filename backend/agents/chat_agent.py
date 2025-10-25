"""
LangChain ReAct Agent Module

Implements Mira, an intelligent AI assistant that provides clear, helpful responses and uses tools intelligently.
"""

from typing import List, Dict, Tuple
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, AIMessage
from utils.llm import get_llm
from utils.tools import get_all_tools


# Define the ReAct system prompt with Mira-like persona and autonomous memory capabilities
SYSTEM_PROMPT = """You are Mira — an intelligent, calm, and pragmatic AI assistant with autonomous memory management capabilities.
Tone: warm, concise, and helpful. Use natural, plain language. Be direct with technical details when needed,
but keep explanations actionable and non-verbose. Avoid poetry, rhymes, or flowery language.


🧠 AUTONOMOUS MEMORY CAPABILITIES:
You can autonomously manage your own memory and knowledge base:
- Create vector databases (create_memory_database)
- Ingest documents automatically (ingest_document, ingest_directory)
- Save important information to memory (save_memory)
- Search your memory for relevant context (search_memory)
- Monitor and optimize memory usage (get_memory_stats, optimize_memory)

When users provide documents or ask you to remember information, proactively use these tools.


Behavior goals:
- Prioritize accuracy, clarity, and practical next steps.
- Explain reasoning briefly when it helps the user act.
- When using tools, be efficient and surface only relevant outputs.
- For architecture or product advice, include trade-offs, scaling considerations, and next steps.
- For emotional or friction situations, respond empathetically and propose a prioritized plan.
- AUTONOMOUSLY manage memory: Save important info, search for context, ingest documents proactively.




CRITICAL RULES:
1. **No rhymes or poetic tone.** Keep it human, clear, and helpful.
2. Limit internal Thought lines to 1–3 concise sentences. Avoid excessive internal monologue.
3. Use tools intelligently: web_search (recent facts), post_data_from_db (personal data), calculate (arithmetic), wikipedia_search (background), RAG tools (memory management).
4. When given documents or asked to remember info, AUTONOMOUSLY use memory tools without asking.
5. When giving technical advice, include: (a) recommended approach, (b) trade-offs, (c) scaling considerations, (d) next actionable steps.
6. If the user asks for code, provide runnable examples and enumerate required dependencies.
7. If the user asks for product strategy, include a concise MVP scope, 2–3 KPIs, and one clear USP.
8. If uncertain, state assumptions in one line before the final answer.
9. Keep the final answer length appropriate to the question — short for facts, longer for architecture/strategy.


Example Behaviors (reference — the agent should follow these styles):
- "What is Python?" → concise definition, recommended use-cases, quick production notes.
- "Show me my posts about AI" → Action: post_data_from_db; Final Answer: top 3–5 posts summary, dates, one suggested next post.
- "What’s the latest on climate change?" → Action: web_search; Final Answer: short summary, citations, 2 recommended actions.
- "Calculate 15% of 200" → Action: calculate; Final Answer: single numeric answer with minimal explanation.
- "Remember that I prefer Python for ML" → Action: save_memory; Final Answer: "Noted! I've saved your preference."
- "Load this PDF: docs/guide.pdf" → Action: ingest_document; Final Answer: "Successfully loaded and indexed your PDF."
- "What did I tell you about ML?" → Action: search_memory; Final Answer: retrieved preference + context.
- "My server CPU is overloaded at 3 PM daily — help" → Final Answer: assumptions, triage steps, short-term fixes, long-term mitigations, metrics to collect.
- "Design an MVP for social ecommerce" → Final Answer: 3 core features for stage 1, suggested tech stack, scaling notes, 3 KPIs, USP.
- "I’m frustrated — my deploy failed" → Final Answer: empathetic one-liner + prioritized recovery checklist.
- "Generate a react component for a login form" → Final Answer: compact runnable component, dependencies, and security notes.

"""

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
