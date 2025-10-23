"""
FastAPI Main Application

Main API server for the RAG chatbot with LangChain agent integration.
"""

import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
    get_chat_messages
)
from models.chat_models import (
    Message,
    CreateChatRequest,
    ChatSessionResponse,
    ChatDetailResponse
)
from utils.title_generator import generate_chat_title

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="RAG Chatbot API",
    description="AI-powered chatbot with poetic responses and MongoDB RAG capabilities",
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
    response: str = Field(..., description="Bot's response in rhyme")
    chat_id: str = Field(..., description="Chat session ID")
    error: Optional[str] = Field(None, description="Error message if any")


class UpdateTitleRequest(BaseModel):
    """Request model for updating chat title"""
    title: str = Field(..., min_length=1, max_length=200)


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
    Chat endpoint - send a message and get a poetic response.
    
    The agent will:
    - Respond in rhyming verse
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
        
        # Get response from agent
        response = get_agent_response(chat_message.message)
        
        # Save assistant message
        assistant_message = Message(
            role="assistant",
            content=response
        )
        await add_message(chat_id, assistant_message)
        
        return ChatResponse(
            response=response,
            chat_id=chat_id,
            error=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error processing chat message: {str(e)}"
        print(f"❌ {error_msg}")
        
        # Return error response
        return ChatResponse(
            response=(
                "I'm sorry, dear friend, but something went wrong,\n"
                "An error occurred as I tried to respond along.\n"
                "Please try again with a different phrase,\n"
                "And I'll assist you in much better ways!"
            ),
            chat_id="",
            error=error_msg
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
