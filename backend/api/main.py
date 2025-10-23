"""
FastAPI Main Application

Main API server for the RAG chatbot with LangChain agent integration.
"""

import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from agents.chat_agent import get_agent_response
from database.connection import test_connection

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


class ChatResponse(BaseModel):
    """Response model for chat messages"""
    response: str = Field(..., description="Bot's response in rhyme")
    error: Optional[str] = Field(None, description="Error message if any")


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
    
    Args:
        chat_message: ChatMessage with user's message
    
    Returns:
        ChatResponse: Bot's poetic response
    """
    try:
        # Validate message
        if not chat_message.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )
        
        # Get response from agent
        response = get_agent_response(chat_message.message)
        
        return ChatResponse(
            response=response,
            error=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error processing chat message: {str(e)}"
        print(f"❌ {error_msg}")
        
        return ChatResponse(
            response=(
                "I'm sorry, dear friend, but something went wrong,\n"
                "An error occurred as I tried to respond along.\n"
                "Please try again with a different phrase,\n"
                "And I'll assist you in much better ways!"
            ),
            error=error_msg
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
