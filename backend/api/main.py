"""
FastAPI Main Application

Main API server for the RAG chatbot with LangChain agent integration.
"""

import os
import json
import asyncio
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from agents.chat_agent import get_agent_response
from database.connection import test_connection
from database.chat_repository import (
    create_chat_session,
    get_chat_session,
    list_chat_sessions,
    add_message,
    delete_chat_session,
    update_chat_title,
    get_chat_messages,
    update_message,
    delete_message,
    regenerate_from_message,
    get_chat_stats,
    get_recent_message_stats
)
from models.chat_models import (
    Message,
    CreateChatRequest,
    ChatSessionResponse,
    ChatDetailResponse
)
from models.usage_models import UsageStatsResponse
from utils.title_generator import generate_chat_title

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="RAG Chatbot API",
    description="AI-powered chatbot with intelligent responses and MongoDB RAG capabilities",
    version="1.0.0"
)

# CORS configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class ChatMessage(BaseModel):
    """Request model for chat messages"""
    message: str = Field(
        ..., 
        description="User's message to the chatbot",
        min_length=1,
        max_length=2000
    )
    chat_id: Optional[str] = Field(
        None,
        description="Optional chat session ID to continue conversation"
    )


class ChatResponse(BaseModel):
    """Response model for chat messages"""
    response: str = Field(..., description="Bot's response")
    chat_id: str = Field(..., description="Chat session ID")
    error: Optional[str] = Field(None, description="Error message if any")
    thought_process: List[dict[str, str]] = Field(
        default_factory=list,
        description="Agent's reasoning steps (Thought/Action/Observation)"
    )
    llm_metadata: Optional[dict] = Field(
        None,
        description="LLM selection metadata (model, complexity, auto-switching info)"
    )


class UpdateTitleRequest(BaseModel):
    """Request model for updating chat title"""
    title: str = Field(..., min_length=1, max_length=200)


class UpdateMessageRequest(BaseModel):
    """Request model for updating message content"""
    content: str = Field(..., min_length=1, max_length=5000)


class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    message: str
    database_connected: bool


# API Endpoints
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to RAG Chatbot API",
        "docs": "/docs",
        "health": "/api/health"
    }


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify API and database connectivity.
    """
    db_connected = test_connection()
    
    return HealthResponse(
        status="healthy" if db_connected else "degraded",
        message="API is running",
        database_connected=db_connected
    )


@app.post("/api/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(chat_message: ChatMessage):
    """
    Chat endpoint - send a message and get an intelligent response.
    
    The agent will:
    - Respond clearly and concisely
    - Use MongoDB tool only for personal post queries
    - Answer general questions directly
    - Maintain conversation history when chat_id is provided
    
    Args:
        chat_message: ChatMessage with user's message and optional chat_id
    
    Returns:
        ChatResponse: Bot's poetic response with chat_id
    """
    try:
        # Validate message
        if not chat_message.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )
        
        # Get or create chat session
        chat_id = chat_message.chat_id
        is_first_message = False
        
        if not chat_id:
            # Create new chat session
            chat_id = await create_chat_session(title="New Chat")
            is_first_message = True
        else:
            # Check if this is the first message (for title generation)
            chat = await get_chat_session(chat_id)
            if chat and len(chat.messages) == 0:
                is_first_message = True
        
        # Save user message
        user_message = Message(
            role="user",
            content=chat_message.message.strip()
        )
        await add_message(chat_id, user_message)
        
        # Auto-generate title from first message
        if is_first_message:
            title = await generate_chat_title(chat_message.message.strip())
            await update_chat_title(chat_id, title)
        
        # Get conversation history for context (last 10 messages, excluding current one)
        chat_history_messages = await get_chat_messages(chat_id, limit=10)
        chat_history = [
            {"role": msg.role, "content": msg.content}
            for msg in chat_history_messages[:-1]  # Exclude the message we just added
        ]
        
        # Get response from agent with conversation history, thought process, and LLM metadata
        response, thought_process, llm_metadata = get_agent_response(chat_message.message, chat_history=chat_history)
        
        # Save assistant message with thought process and LLM metadata
        assistant_message = Message(
            role="assistant",
            content=response,
            thought_process=thought_process,
            metadata={
                "thought_process": thought_process,
                "llm_metadata": llm_metadata
            } if thought_process or llm_metadata else None
        )
        await add_message(chat_id, assistant_message)
        
        return ChatResponse(
            response=response,
            chat_id=chat_id,
            error=None,
            thought_process=thought_process,
            llm_metadata=llm_metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error processing chat message: {str(e)}"
        print(f"❌ {error_msg}")
        
        # Return error response
        return ChatResponse(
            response="I apologize, but I encountered an error while processing your request. Please try again.",
            chat_id="",
            error=error_msg
        )


@app.post("/api/chat/stream", tags=["Chat"])
async def chat_stream(chat_message: ChatMessage):
    """
    Stream chat responses word-by-word using Server-Sent Events (SSE).
    
    This endpoint provides real-time streaming of the agent's response.
    """
    async def generate_stream():
        try:
            # Validate message
            if not chat_message.message.strip():
                yield f"data: {json.dumps({'error': 'Message cannot be empty'})}\n\n"
                return
            
            # Get or create chat session
            chat_id = chat_message.chat_id
            is_first_message = False
            
            if not chat_id:
                chat_id = await create_chat_session(title="New Chat")
                is_first_message = True
                yield f"data: {json.dumps({'type': 'chat_id', 'chat_id': chat_id})}\n\n"
            else:
                chat = await get_chat_session(chat_id)
                if chat and len(chat.messages) == 0:
                    is_first_message = True
            
            # Save user message
            user_message = Message(
                role="user",
                content=chat_message.message.strip()
            )
            await add_message(chat_id, user_message)
            
            # Auto-generate title from first message
            if is_first_message:
                title = await generate_chat_title(chat_message.message.strip())
                await update_chat_title(chat_id, title)
                yield f"data: {json.dumps({'type': 'title', 'title': title})}\n\n"
            
            # Get conversation history
            chat_history_messages = await get_chat_messages(chat_id, limit=10)
            chat_history = [
                {"role": msg.role, "content": msg.content}
                for msg in chat_history_messages[:-1]
            ]
            
            # Get response from agent with LLM metadata
            response, thought_process, llm_metadata = get_agent_response(chat_message.message, chat_history=chat_history)
            
            # Send LLM metadata first
            if llm_metadata:
                yield f"data: {json.dumps({'type': 'llm_metadata', 'metadata': llm_metadata})}\n\n"
            
            # Send thought process
            if thought_process:
                yield f"data: {json.dumps({'type': 'thought_process', 'steps': thought_process})}\n\n"
            
            # Stream response word by word
            words = response.split()
            for i, word in enumerate(words):
                yield f"data: {json.dumps({'type': 'token', 'content': word + (' ' if i < len(words) - 1 else '')})}\n\n"
                await asyncio.sleep(0.05)  # Small delay between words for streaming effect
            
            # Save assistant message with thought process and LLM metadata
            assistant_message = Message(
                role="assistant",
                content=response,
                thought_process=thought_process,
                metadata={
                    "thought_process": thought_process,
                    "llm_metadata": llm_metadata
                } if thought_process or llm_metadata else None
            )
            await add_message(chat_id, assistant_message)
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done', 'chat_id': chat_id})}\n\n"
            
        except Exception as e:
            error_msg = f"Error in streaming: {str(e)}"
            print(f"❌ {error_msg}")
            yield f"data: {json.dumps({'type': 'error', 'error': error_msg})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/api/chats", response_model=dict, tags=["Chat Sessions"])
async def create_new_chat(request: CreateChatRequest):
    """
    Create a new chat session
    
    Args:
        request: CreateChatRequest with optional title and metadata
    
    Returns:
        dict with chat_id
    """
    try:
        chat_id = await create_chat_session(
            title=request.title or "New Chat",
            metadata=request.metadata
        )
        
        return {
            "chat_id": chat_id,
            "message": "Chat session created successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create chat session: {str(e)}"
        )


@app.get("/api/chats", response_model=List[ChatSessionResponse], tags=["Chat Sessions"])
async def get_all_chats(limit: int = 50, skip: int = 0):
    """
    Get all chat sessions (without full message history)
    
    Args:
        limit: Maximum number of sessions to return (default: 50)
        skip: Number of sessions to skip for pagination (default: 0)
    
    Returns:
        List of ChatSessionResponse objects
    """
    try:
        sessions = await list_chat_sessions(limit=limit, skip=skip)
        return sessions
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve chat sessions: {str(e)}"
        )


@app.get("/api/chats/{chat_id}", response_model=ChatDetailResponse, tags=["Chat Sessions"])
async def get_chat_detail(chat_id: str):
    """
    Get a specific chat session with full message history
    
    Args:
        chat_id: Chat session ID
    
    Returns:
        ChatDetailResponse with full message history
    """
    try:
        chat = await get_chat_session(chat_id)
        
        if not chat:
            raise HTTPException(
                status_code=404,
                detail="Chat session not found"
            )
        
        return chat
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve chat session: {str(e)}"
        )


@app.delete("/api/chats/{chat_id}", tags=["Chat Sessions"])
async def delete_chat(chat_id: str):
    """
    Delete a chat session
    
    Args:
        chat_id: Chat session ID
    
    Returns:
        Success message
    """
    try:
        deleted = await delete_chat_session(chat_id)
        
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Chat session not found"
            )
        
        return {
            "message": "Chat session deleted successfully",
            "chat_id": chat_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete chat session: {str(e)}"
        )


@app.put("/api/chats/{chat_id}/title", tags=["Chat Sessions"])
async def update_title(chat_id: str, request: UpdateTitleRequest):
    """
    Update chat session title
    
    Args:
        chat_id: Chat session ID
        request: UpdateTitleRequest with new title
    
    Returns:
        Success message
    """
    try:
        updated = await update_chat_title(chat_id, request.title)
        
        if not updated:
            raise HTTPException(
                status_code=404,
                detail="Chat session not found"
            )
        
        return {
            "message": "Chat title updated successfully",
            "chat_id": chat_id,
            "title": request.title
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update chat title: {str(e)}"
        )


@app.put("/api/chats/{chat_id}/messages/{message_id}", tags=["Messages"])
async def update_chat_message(chat_id: str, message_id: str, request: UpdateMessageRequest):
    """
    Update a specific message content
    
    Args:
        chat_id: Chat session ID
        message_id: Message ID
        request: UpdateMessageRequest with new content
    
    Returns:
        Success message
    """
    try:
        updated = await update_message(chat_id, message_id, request.content)
        
        if not updated:
            raise HTTPException(
                status_code=404,
                detail="Message not found"
            )
        
        return {
            "message": "Message updated successfully",
            "chat_id": chat_id,
            "message_id": message_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update message: {str(e)}"
        )


@app.delete("/api/chats/{chat_id}/messages/{message_id}", tags=["Messages"])
async def delete_chat_message(chat_id: str, message_id: str):
    """
    Delete a specific message
    
    Args:
        chat_id: Chat session ID
        message_id: Message ID
    
    Returns:
        Success message
    """
    try:
        deleted = await delete_message(chat_id, message_id)
        
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Message not found"
            )
        
        return {
            "message": "Message deleted successfully",
            "chat_id": chat_id,
            "message_id": message_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete message: {str(e)}"
        )


@app.post("/api/chats/{chat_id}/regenerate/{message_id}", tags=["Messages"])
async def regenerate_message(chat_id: str, message_id: str):
    """
    Regenerate response from a specific message (removes all messages after it)
    
    Args:
        chat_id: Chat session ID
        message_id: Message ID to regenerate from
    
    Returns:
        Success message with new response
    """
    try:
        # Truncate messages after the specified message
        truncated = await regenerate_from_message(chat_id, message_id)
        
        if not truncated:
            raise HTTPException(
                status_code=404,
                detail="Message not found"
            )
        
        # Get the updated chat to retrieve the last message
        chat = await get_chat_session(chat_id)
        
        if not chat or len(chat.messages) == 0:
            raise HTTPException(
                status_code=400,
                detail="No messages to regenerate from"
            )
        
        # Get the last message (which should be the one we want to regenerate from)
        last_message = chat.messages[-1]
        
        if last_message.role != "user":
            raise HTTPException(
                status_code=400,
                detail="Can only regenerate from user messages"
            )
        
        # Get conversation history for context (all remaining messages after truncation)
        chat_history_messages = await get_chat_messages(chat_id, limit=10)
        chat_history = [
            {"role": msg.role, "content": msg.content}
            for msg in chat_history_messages[:-1]  # Exclude the last message (user message to regenerate)
        ]
        
        # Generate new response with conversation history, thought process, and LLM metadata
        response, thought_process, llm_metadata = get_agent_response(last_message.content, chat_history=chat_history)
        
        # Save assistant message with thought process and LLM metadata
        assistant_message = Message(
            role="assistant",
            content=response,
            metadata={
                "thought_process": thought_process,
                "llm_metadata": llm_metadata
            } if thought_process or llm_metadata else None
        )
        await add_message(chat_id, assistant_message)
        
        return {
            "message": "Response regenerated successfully",
            "chat_id": chat_id,
            "response": response,
            "thought_process": thought_process,
            "llm_metadata": llm_metadata
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to regenerate message: {str(e)}"
        )


@app.get("/api/chats/{chat_id}/stats", response_model=UsageStatsResponse)
async def get_statistics(chat_id: str):
    """
    Get usage statistics for a specific chat session.
    
    Returns aggregated token usage, costs, tool usage, and performance metrics.
    """
    # Get session stats
    session_stats = await get_chat_stats(chat_id)
    
    if not session_stats:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found or no statistics available"
        )
    
    # Get recent message stats
    recent_messages = await get_recent_message_stats(chat_id, limit=10)
    
    # Create breakdown data
    breakdown = {
        "tokens_per_message_avg": (
            session_stats.total_tokens.total_tokens / session_stats.total_messages
            if session_stats.total_messages > 0
            else 0
        ),
        "cost_per_message_avg": (
            session_stats.total_cost / session_stats.total_messages
            if session_stats.total_messages > 0
            else 0
        ),
        "tool_usage_count": len(session_stats.tool_usage_summary),
        "most_used_tool": (
            max(session_stats.tool_usage_summary, key=lambda t: t.call_count).tool_name
            if session_stats.tool_usage_summary
            else None
        )
    }
    
    return UsageStatsResponse(
        chat_id=chat_id,
        session_stats=session_stats,
        recent_messages=recent_messages,
        breakdown=breakdown
    )


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    print("🚀 Starting RAG Chatbot API...")
    print(f"📡 CORS enabled for: {CORS_ORIGINS}")
    
    # Test database connection
    if test_connection():
        print("✅ Database connection verified")
    else:
        print("⚠️ Warning: Database connection failed")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    print("👋 Shutting down RAG Chatbot API...")


# Run with uvicorn
if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
