"""
FastAPI Main Application

Main API server for the RAG chatbot with LangChain agent integration.
"""

import os
import json
import asyncio
from typing import Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
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
from database.task_repository import task_repository
from database.reminder_repository import reminder_repository
from database.prompt_template_repository import PromptTemplateRepository
from models.chat_models import (
    Message,
    CreateChatRequest,
    ChatSessionResponse,
    ChatDetailResponse
)
from models.task_models import (
    Task,
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskListResponse,
    TaskStatsResponse,
    BulkDeleteRequest as TaskBulkDeleteRequest,
    TaskStatus,
    TaskPriority
)
from models.reminder_models import (
    Reminder,
    ReminderCreate,
    ReminderUpdate,
    ReminderListResponse,
    ReminderStatsResponse,
    BulkDeleteRequest as ReminderBulkDeleteRequest,
    SnoozeRequest,
    ReminderStatus,
    ReminderPriority,
    RecurrenceType
)
from models.prompt_template_models import (
    PromptTemplate,
    PromptTemplateCreate,
    PromptTemplateUpdate,
    PromptTemplateStats,
    PromptTemplateUsageTrack
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

# Initialize repositories
from database.connection import get_async_database
async_db = get_async_database()
prompt_template_repository = PromptTemplateRepository(async_db)


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
    retrieval_context: Optional[dict] = Field(
        None,
        description="RAG retrieval context (chunks, scores, sources)"
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

        # Get response from agent with conversation history, thought process, LLM metadata, and retrieval context
        response, thought_process, llm_metadata, retrieval_context = get_agent_response(
            chat_message.message,
            chat_history=chat_history,
            chat_id=chat_id
        )

        # Save assistant message with thought process, LLM metadata, and retrieval context
        assistant_message = Message(
            role="assistant",
            content=response,
            thought_process=thought_process,
            metadata={
                "thought_process": thought_process,
                "llm_metadata": llm_metadata,
                "retrieval_context": retrieval_context
            } if thought_process or llm_metadata or retrieval_context else None
        )
        await add_message(chat_id, assistant_message)

        return ChatResponse(
            response=response,
            chat_id=chat_id,
            error=None,
            thought_process=thought_process,
            llm_metadata=llm_metadata,
            retrieval_context=retrieval_context
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
            error=error_msg,
            llm_metadata=None,
            retrieval_context=None
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

            # Get response from agent with LLM metadata and retrieval context
            response, thought_process, llm_metadata, retrieval_context = get_agent_response(
                chat_message.message,
                chat_history=chat_history,
                chat_id=chat_id
            )

            # Send LLM metadata first
            if llm_metadata:
                yield f"data: {json.dumps({'type': 'llm_metadata', 'metadata': llm_metadata})}\n\n"

            # Send retrieval context
            if retrieval_context and retrieval_context.get('total_chunks', 0) > 0:
                yield f"data: {json.dumps({'type': 'retrieval_context', 'context': retrieval_context})}\n\n"

            # Send thought process
            if thought_process:
                yield f"data: {json.dumps({'type': 'thought_process', 'steps': thought_process})}\n\n"

            # Stream response while preserving newlines
            # Split by spaces but keep track of newlines
            lines = response.split('\n')
            for line_idx, line in enumerate(lines):
                words = line.split()
                for i, word in enumerate(words):
                    token_content = word + (' ' if i < len(words) - 1 else '')
                    yield f"data: {json.dumps({'type': 'token', 'content': token_content})}\n\n"
                    await asyncio.sleep(0.05)  # Small delay between words for streaming effect

                # Add newline after each line except the last one
                if line_idx < len(lines) - 1:
                    yield f"data: {json.dumps({'type': 'token', 'content': '\n'})}\n\n"

            # Save assistant message with thought process, LLM metadata, and retrieval context
            assistant_message = Message(
                role="assistant",
                content=response,
                thought_process=thought_process,
                metadata={
                    "thought_process": thought_process,
                    "llm_metadata": llm_metadata,
                    "retrieval_context": retrieval_context
                } if thought_process or llm_metadata or retrieval_context else None
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

        # Generate new response with conversation history, thought process, LLM metadata, and retrieval context
        response, thought_process, llm_metadata, retrieval_context = get_agent_response(
            last_message.content,
            chat_history=chat_history,
            chat_id=chat_id
        )

        # Save assistant message with thought process, LLM metadata, and retrieval context
        assistant_message = Message(
            role="assistant",
            content=response,
            metadata={
                "thought_process": thought_process,
                "llm_metadata": llm_metadata,
                "retrieval_context": retrieval_context
            } if thought_process or llm_metadata or retrieval_context else None
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


# ========================================
# RAG & Document Management Endpoints
# ========================================

@app.post("/api/documents/upload", tags=["Documents"])
async def upload_document(
    file: UploadFile = File(...),
    collection_name: str = Form("global_memory"),
    chat_id: Optional[str] = Form(None)
):
    """
    Upload and process a document for RAG.

    Automatically:
    - Validates file type (PDF, TXT, MD, DOCX, HTML)
    - Processes and chunks the document
    - Embeds and stores in vector database
    - Associates with global or chat-specific memory

    Args:
        file: Uploaded document file
        collection_name: Memory collection name (default: "global_memory")
        chat_id: Optional chat ID for chat-specific memory

    Returns:
        Upload status and document metadata
    """
    try:
        from utils.document_processor import DocumentProcessor
        from database.vector_store import VectorStoreManager
        import tempfile
        from pathlib import Path

        # Validate file type
        supported_extensions = ['.pdf', '.txt', '.md', '.docx', '.html', '.htm']
        file_ext = Path(file.filename).suffix.lower()

        if file_ext not in supported_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Supported: {', '.join(supported_extensions)}"
            )

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        try:
            # Process document
            processor = DocumentProcessor(chunk_size=1000, chunk_overlap=200)
            chunks = processor.process_file(
                tmp_path,
                additional_metadata={
                    "original_filename": file.filename,
                    "chat_id": chat_id
                }
            )

            # Determine collection name
            if chat_id:
                collection_name = f"chat_{chat_id}"

            # Store in vector database
            vs = VectorStoreManager(collection_name=collection_name)
            doc_ids = vs.add_documents(chunks)
            stats = vs.get_collection_stats()

            return {
                "status": "success",
                "message": f"Document '{file.filename}' uploaded and processed successfully",
                "document": {
                    "filename": file.filename,
                    "file_type": file_ext,
                    "chunks_created": len(chunks),
                    "collection": collection_name,
                    "document_ids": doc_ids[:5]  # Return first 5 IDs
                },
                "collection_stats": stats
            }

        finally:
            # Clean up temp file
            os.unlink(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )


@app.get("/api/documents/list", tags=["Documents"])
async def list_documents(collection_name: str = "global_memory", limit: int = 100):
    """
    List all documents in a collection with metadata.

    Args:
        collection_name: Name of the collection (default: "global_memory")
        limit: Maximum number of documents to return (default: 100)

    Returns:
        List of documents with metadata
    """
    try:
        from database.vector_store import VectorStoreManager

        vs = VectorStoreManager(collection_name=collection_name)
        documents = vs.get_all_documents(limit=limit)
        stats = vs.get_collection_stats()

        # Group documents by filename
        grouped_docs = {}
        for doc in documents:
            metadata = doc.get("metadata", {})
            filename = metadata.get("original_filename") or metadata.get(
                "filename") or metadata.get("source", "Unknown")

            if filename not in grouped_docs:
                grouped_docs[filename] = {
                    "filename": filename,
                    "chunks": 0,
                    "file_type": metadata.get("file_type", "unknown"),
                    "uploaded_at": metadata.get("uploaded_at") or metadata.get("timestamp", "N/A"),
                    "total_chars": 0,
                    "metadata": metadata
                }

            grouped_docs[filename]["chunks"] += 1
            grouped_docs[filename]["total_chars"] += len(doc.get("content", ""))

        return {
            "status": "success",
            "collection": collection_name,
            "total_documents": len(grouped_docs),
            "total_chunks": len(documents),
            "documents": list(grouped_docs.values()),
            "collection_stats": stats
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing documents: {str(e)}"
        )


@app.delete("/api/documents/{collection_name}/{filename}", tags=["Documents"])
async def delete_document(collection_name: str, filename: str):
    """
    Delete a specific document from a collection.

    Args:
        collection_name: Name of the collection
        filename: Name of the file to delete

    Returns:
        Deletion status
    """
    try:
        from database.vector_store import VectorStoreManager

        vs = VectorStoreManager(collection_name=collection_name)

        # Get all documents
        all_docs = vs.get_all_documents(limit=1000)

        # Find IDs of chunks belonging to this filename
        ids_to_delete = []
        chunks_found = 0

        for i, doc in enumerate(all_docs):
            metadata = doc.get("metadata", {})
            doc_filename = metadata.get("original_filename") or metadata.get("filename") or metadata.get("source")

            if doc_filename == filename:
                # Generate ID (this is a simplified approach - in production, store actual IDs)
                ids_to_delete.append(str(i))
                chunks_found += 1

        if not ids_to_delete:
            raise HTTPException(
                status_code=404,
                detail=f"Document '{filename}' not found in collection '{collection_name}'"
            )

        # Delete the chunks
        vs.delete_documents(ids_to_delete)

        return {
            "status": "success",
            "message": f"Deleted document '{filename}' ({chunks_found} chunks)",
            "collection": collection_name,
            "filename": filename,
            "chunks_deleted": chunks_found
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting document: {str(e)}"
        )


@app.post("/api/documents/bulk-delete", tags=["Documents"])
async def bulk_delete_documents(
    collection_name: str = Form(...),
    filenames: str = Form(...)  # JSON string array
):
    """
    Delete multiple documents at once.

    Args:
        collection_name: Name of the collection
        filenames: JSON string array of filenames to delete

    Returns:
        Bulk deletion status
    """
    try:
        import json
        from database.vector_store import VectorStoreManager

        # Parse filenames
        try:
            filename_list = json.loads(filenames)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid filenames format")

        vs = VectorStoreManager(collection_name=collection_name)
        all_docs = vs.get_all_documents(limit=1000)

        results = []
        total_chunks_deleted = 0

        for filename in filename_list:
            ids_to_delete = []
            chunks_found = 0

            for i, doc in enumerate(all_docs):
                metadata = doc.get("metadata", {})
                doc_filename = metadata.get("original_filename") or metadata.get("filename") or metadata.get("source")

                if doc_filename == filename:
                    ids_to_delete.append(str(i))
                    chunks_found += 1

            if ids_to_delete:
                vs.delete_documents(ids_to_delete)
                total_chunks_deleted += chunks_found
                results.append({
                    "filename": filename,
                    "status": "success",
                    "chunks_deleted": chunks_found
                })
            else:
                results.append({
                    "filename": filename,
                    "status": "not_found",
                    "chunks_deleted": 0
                })

        return {
            "status": "success",
            "message": f"Bulk delete completed: {len(results)} files processed",
            "total_chunks_deleted": total_chunks_deleted,
            "results": results
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in bulk delete: {str(e)}"
        )


@app.get("/api/documents/preview/{collection_name}/{filename}", tags=["Documents"])
async def preview_document(collection_name: str, filename: str, max_chars: int = 500):
    """
    Get a preview of a document.

    Args:
        collection_name: Name of the collection
        filename: Name of the file
        max_chars: Maximum characters to return (default: 500)

    Returns:
        Document preview with first few chunks
    """
    try:
        from database.vector_store import VectorStoreManager

        vs = VectorStoreManager(collection_name=collection_name)
        all_docs = vs.get_all_documents(limit=1000)

        # Find chunks for this file
        file_chunks = []
        for doc in all_docs:
            metadata = doc.get("metadata", {})
            doc_filename = metadata.get("original_filename") or metadata.get("filename") or metadata.get("source")

            if doc_filename == filename:
                file_chunks.append({
                    "content": doc.get("content", ""),
                    "metadata": metadata
                })

        if not file_chunks:
            raise HTTPException(
                status_code=404,
                detail=f"Document '{filename}' not found"
            )

        # Get preview from first chunks
        preview_text = ""
        for chunk in file_chunks[:3]:  # First 3 chunks
            preview_text += chunk["content"] + "\n\n"
            if len(preview_text) >= max_chars:
                preview_text = preview_text[:max_chars] + "..."
                break

        return {
            "status": "success",
            "filename": filename,
            "collection": collection_name,
            "total_chunks": len(file_chunks),
            "preview": preview_text,
            "metadata": file_chunks[0]["metadata"] if file_chunks else {}
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error previewing document: {str(e)}"
        )


@app.get("/api/memory/stats", tags=["Memory"])
async def get_memory_stats(collection_name: str = "global_memory"):
    """
    Get statistics about a memory collection.

    Args:
        collection_name: Name of the collection (default: "global_memory")

    Returns:
        Collection statistics
    """
    try:
        from database.vector_store import VectorStoreManager

        vs = VectorStoreManager(collection_name=collection_name)
        stats = vs.get_collection_stats()

        return {
            "status": "success",
            "stats": stats
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting memory stats: {str(e)}"
        )


@app.post("/api/memory/search", tags=["Memory"])
async def search_memory(
    query: str = Form(...),
    collection_name: str = Form("global_memory"),
    num_results: int = Form(5),
    chat_id: Optional[str] = Form(None),
    use_global: bool = Form(True),
    scope: str = Form("both")
):
    """
    Search memory for relevant information with scope awareness.

    Args:
        query: Search query
        collection_name: Collection to search (legacy parameter)
        num_results: Number of results to return
        chat_id: Optional chat ID for chat-specific search
        use_global: Enable global memory search
        scope: "global", "chat", or "both"

    Returns:
        Search results with source indicators
    """
    try:
        from utils.memory_scope import MemoryManager, MemoryScope

        # Map string to enum
        scope_map = {
            "global": MemoryScope.GLOBAL,
            "chat": MemoryScope.CHAT,
            "both": MemoryScope.BOTH
        }
        memory_scope = scope_map.get(scope.lower(), MemoryScope.BOTH)

        # Use new memory manager
        manager = MemoryManager(chat_id=chat_id, use_global=use_global)
        results = manager.search(query, scope=memory_scope, k=num_results)

        return {
            "status": "success",
            "query": query,
            "scope": scope,
            "chat_id": chat_id,
            "use_global": use_global,
            "results": results,
            "total_found": len(results)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching memory: {str(e)}"
        )


@app.delete("/api/memory/{collection_name}", tags=["Memory"])
async def delete_memory_collection(collection_name: str):
    """
    Delete an entire memory collection.

    Args:
        collection_name: Name of the collection to delete

    Returns:
        Deletion status
    """
    try:
        from database.vector_store import VectorStoreManager

        vs = VectorStoreManager(collection_name=collection_name)
        success = vs.clear_collection()

        if success:
            return {
                "status": "success",
                "message": f"Collection '{collection_name}' deleted successfully"
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete collection '{collection_name}'"
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting collection: {str(e)}"
        )


@app.post("/api/memory/save", tags=["Memory"])
async def save_to_memory_endpoint(
    content: str = Form(...),
    chat_id: Optional[str] = Form(None),
    use_global: bool = Form(True),
    scope: str = Form("global"),
    metadata: Optional[str] = Form(None)
):
    """
    Save information to memory with scope control.

    Args:
        content: Content to save
        chat_id: Optional chat ID for chat-specific memory
        use_global: Enable global memory
        scope: "global", "chat", or "both"
        metadata: Optional JSON metadata

    Returns:
        Save status
    """
    try:
        from utils.memory_scope import MemoryManager, MemoryScope
        import json

        # Parse metadata if provided
        meta = json.loads(metadata) if metadata else {}

        # Map string to enum
        scope_map = {
            "global": MemoryScope.GLOBAL,
            "chat": MemoryScope.CHAT,
            "both": MemoryScope.BOTH
        }
        memory_scope = scope_map.get(scope.lower(), MemoryScope.GLOBAL)

        # Save using memory manager
        manager = MemoryManager(chat_id=chat_id, use_global=use_global)
        result = manager.save(content, metadata=meta, scope=memory_scope)

        return {
            "status": result["status"],
            "message": result["message"],
            "saved_to": result.get("saved_to", [])
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error saving to memory: {str(e)}"
        )


@app.get("/api/memory/stats/{scope}", tags=["Memory"])
async def get_scoped_memory_stats(
    scope: str,
    chat_id: Optional[str] = None,
    use_global: bool = True
):
    """
    Get memory statistics with scope awareness.

    Args:
        scope: "global", "chat", or "both"
        chat_id: Optional chat ID
        use_global: Enable global memory

    Returns:
        Memory statistics
    """
    try:
        from utils.memory_scope import MemoryManager, MemoryScope

        # Map string to enum
        scope_map = {
            "global": MemoryScope.GLOBAL,
            "chat": MemoryScope.CHAT,
            "both": MemoryScope.BOTH
        }
        memory_scope = scope_map.get(scope.lower(), MemoryScope.BOTH)

        manager = MemoryManager(chat_id=chat_id, use_global=use_global)
        stats = manager.get_stats(scope=memory_scope)

        return {
            "status": "success",
            "scope": scope,
            "chat_id": chat_id,
            "stats": stats
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting memory stats: {str(e)}"
        )


# Memory CRUD Request/Response Models
class CreateMemoryRequest(BaseModel):
    """Request model for creating a memory"""
    content: str = Field(..., min_length=1, max_length=10000)
    collection: str = Field("global_memory", description="Collection to save to")
    metadata: Optional[dict] = Field(default_factory=dict, description="Additional metadata")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags for the memory")


class UpdateMemoryRequest(BaseModel):
    """Request model for updating a memory"""
    content: Optional[str] = Field(None, min_length=1, max_length=10000)
    metadata: Optional[dict] = Field(None, description="Metadata to merge")
    tags: Optional[List[str]] = Field(None, description="Tags to update")


class BulkDeleteRequest(BaseModel):
    """Request model for bulk deleting memories"""
    memory_ids: List[str] = Field(..., description="List of memory IDs to delete")


class MemoryResponse(BaseModel):
    """Response model for a single memory"""
    memory_id: str
    content: str
    metadata: dict
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    tags: Optional[List[str]] = None


class MemoryListResponse(BaseModel):
    """Response model for memory list"""
    status: str
    collection: str
    total: int
    limit: int
    offset: int
    memories: List[MemoryResponse]


def parse_tags(tags_value) -> List[str]:
    """Parse tags from metadata (handles both string and list formats)"""
    if not tags_value:
        return []
    if isinstance(tags_value, list):
        return tags_value
    if isinstance(tags_value, str):
        return [t.strip() for t in tags_value.split(',') if t.strip()]
    return []


@app.post("/api/memory/create", tags=["Memory"])
async def create_memory(request: CreateMemoryRequest):
    """
    Create a new memory entry.

    Args:
        request: CreateMemoryRequest with content, collection, metadata, tags

    Returns:
        Created memory with generated ID
    """
    try:
        from database.vector_store import VectorStoreManager
        from utils.memory_utils import generate_memory_id, validate_memory_content, extract_tags_from_content
        from datetime import datetime

        # Validate content
        is_valid, error = validate_memory_content(request.content)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)

        # Generate memory ID
        memory_id = generate_memory_id(request.content)

        # Prepare metadata
        metadata = {
            "memory_id": memory_id,
            "created_at": datetime.now().isoformat(),
            "source": "user_created",
            **(request.metadata or {})
        }

        # Extract and merge tags
        auto_tags = extract_tags_from_content(request.content)
        all_tags = list(set((request.tags or []) + auto_tags))
        if all_tags:
            # ChromaDB doesn't support lists - convert to comma-separated string
            metadata["tags"] = ",".join(all_tags)

        # Save to vector store
        vs = VectorStoreManager(collection_name=request.collection)
        from langchain_core.documents import Document
        doc = Document(page_content=request.content, metadata=metadata)
        vs.add_documents([doc])

        return {
            "status": "success",
            "memory_id": memory_id,
            "collection": request.collection,
            "content": request.content,
            "metadata": metadata,
            "tags": all_tags
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating memory: {str(e)}"
        )


@app.get("/api/memory/list/{collection}", tags=["Memory"])
async def list_memories(
    collection: str,
    limit: int = 50,
    offset: int = 0,
    tag: Optional[str] = None
):
    """
    List memories with pagination and filtering.

    Args:
        collection: Collection name
        limit: Maximum results per page (default 50)
        offset: Results to skip (default 0)
        tag: Optional tag filter

    Returns:
        Paginated list of memories
    """
    try:
        from database.vector_store import VectorStoreManager

        vs = VectorStoreManager(collection_name=collection)

        # Build where filter if tag specified
        where = {"tags": {"$contains": tag}} if tag else None

        # Get total count
        total = vs.count_documents(where=where)

        # Get paginated documents
        documents = vs.list_documents(limit=limit, offset=offset, where=where)

        # Format response
        memories = []
        for doc in documents:
            metadata = doc.get("metadata", {})
            memories.append({
                "memory_id": metadata.get("memory_id", doc["id"]),
                "content": doc["content"],
                "metadata": metadata,
                "created_at": metadata.get("created_at"),
                "updated_at": metadata.get("updated_at"),
                "tags": parse_tags(metadata.get("tags"))
            })

        return {
            "status": "success",
            "collection": collection,
            "total": total,
            "limit": limit,
            "offset": offset,
            "memories": memories
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing memories: {str(e)}"
        )


@app.get("/api/memory/{collection}/{memory_id}", tags=["Memory"])
async def get_memory(collection: str, memory_id: str):
    """
    Get a specific memory by ID.

    Args:
        collection: Collection name
        memory_id: Unique memory ID

    Returns:
        Memory details
    """
    try:
        from database.vector_store import VectorStoreManager

        vs = VectorStoreManager(collection_name=collection)
        document = vs.get_document_by_id(memory_id)

        if not document:
            raise HTTPException(status_code=404, detail="Memory not found")

        metadata = document.get("metadata", {})
        return {
            "status": "success",
            "memory_id": memory_id,
            "content": document["content"],
            "metadata": metadata,
            "created_at": metadata.get("created_at"),
            "updated_at": metadata.get("updated_at"),
            "tags": parse_tags(metadata.get("tags"))
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting memory: {str(e)}"
        )


@app.put("/api/memory/{collection}/{memory_id}", tags=["Memory"])
async def update_memory(
    collection: str,
    memory_id: str,
    request: UpdateMemoryRequest
):
    """
    Update an existing memory.

    Args:
        collection: Collection name
        memory_id: Unique memory ID
        request: UpdateMemoryRequest with optional content, metadata, tags

    Returns:
        Updated memory
    """
    try:
        from database.vector_store import VectorStoreManager
        from utils.memory_utils import validate_memory_content, extract_tags_from_content

        # Validate content if provided
        if request.content:
            is_valid, error = validate_memory_content(request.content)
            if not is_valid:
                raise HTTPException(status_code=400, detail=error)

        # Prepare metadata update
        metadata_update = request.metadata or {}

        # Handle tags
        if request.tags is not None:
            # ChromaDB doesn't support lists - convert to comma-separated string
            metadata_update["tags"] = ",".join(request.tags)
        elif request.content:
            # Auto-extract tags from new content
            auto_tags = extract_tags_from_content(request.content)
            if auto_tags:
                metadata_update["tags"] = ",".join(auto_tags)

        # Update document
        vs = VectorStoreManager(collection_name=collection)
        success = vs.update_document(
            memory_id=memory_id,
            content=request.content,
            metadata=metadata_update
        )

        if not success:
            raise HTTPException(status_code=404, detail="Memory not found")

        # Fetch updated document
        updated = vs.get_document_by_id(memory_id)
        if not updated:
            raise HTTPException(status_code=500, detail="Failed to retrieve updated memory")

        metadata = updated.get("metadata", {})

        return {
            "status": "success",
            "memory_id": memory_id,
            "content": updated["content"],
            "metadata": metadata,
            "updated_at": metadata.get("updated_at"),
            "tags": parse_tags(metadata.get("tags"))
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating memory: {str(e)}"
        )


@app.delete("/api/memory/{collection}/{memory_id}", tags=["Memory"])
async def delete_memory(collection: str, memory_id: str):
    """
    Delete a specific memory.

    Args:
        collection: Collection name
        memory_id: Unique memory ID

    Returns:
        Deletion status
    """
    try:
        from database.vector_store import VectorStoreManager

        vs = VectorStoreManager(collection_name=collection)
        success = vs.delete_document(memory_id)

        if not success:
            raise HTTPException(status_code=404, detail="Memory not found")

        return {
            "status": "success",
            "message": f"Memory {memory_id} deleted",
            "memory_id": memory_id
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting memory: {str(e)}"
        )


@app.post("/api/memory/bulk-delete", tags=["Memory"])
async def bulk_delete_memories(
    collection: str,
    request: BulkDeleteRequest
):
    """
    Delete multiple memories at once.

    Args:
        collection: Collection name
        request: BulkDeleteRequest with memory IDs

    Returns:
        Deletion status with count
    """
    try:
        from database.vector_store import VectorStoreManager

        vs = VectorStoreManager(collection_name=collection)
        deleted_count = vs.bulk_delete_documents(request.memory_ids)

        return {
            "status": "success",
            "message": f"Deleted {deleted_count} memories",
            "deleted_count": deleted_count,
            "requested_count": len(request.memory_ids)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in bulk delete: {str(e)}"
        )


@app.get("/api/memory/tags/{collection}", tags=["Memory"])
async def get_all_tags(collection: str):
    """
    Get all unique tags in a collection.

    Args:
        collection: Collection name

    Returns:
        List of unique tags
    """
    try:
        from database.vector_store import VectorStoreManager

        vs = VectorStoreManager(collection_name=collection)
        tags = vs.get_all_tags()

        return {
            "status": "success",
            "collection": collection,
            "tags": tags,
            "count": len(tags)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting tags: {str(e)}"
        )


@app.get("/api/memory/list/{collection_name}", tags=["Memory"])
async def list_collection_memories(
    collection_name: str,
    limit: int = 100
):
    """
    List all memories in a specific collection.

    Args:
        collection_name: Name of the collection (e.g., 'global_memory', 'chat_123')
        limit: Maximum number of memories to return (default 100)

    Returns:
        List of all memories in the collection
    """
    try:
        from database.vector_store import VectorStoreManager

        # Get vector store for collection
        vs = VectorStoreManager(collection_name=collection_name)

        # Get all documents
        documents = vs.get_all_documents(limit=limit)

        # Add source indicator
        for doc in documents:
            if collection_name == "global_memory":
                doc["source_indicator"] = "🌐 Global Memory"
            else:
                doc["source_indicator"] = f"💬 {collection_name}"

        return {
            "status": "success",
            "collection_name": collection_name,
            "total_count": len(documents),
            "memories": documents
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing memories: {str(e)}"
        )


# ============================================================================
# TASK MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/api/tasks/create", response_model=Task, tags=["Tasks"])
async def create_task(task_data: TaskCreate):
    """
    Create a new task

    Args:
        task_data: Task creation data

    Returns:
        Created task
    """
    try:
        await task_repository.ensure_indexes()
        task = await task_repository.create(task_data)
        return task
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating task: {str(e)}"
        )


@app.get("/api/tasks/list", response_model=TaskListResponse, tags=["Tasks"])
async def list_tasks(
    page: int = 1,
    page_size: int = 50,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    tags: Optional[str] = None,
    search: Optional[str] = None
):
    """
    List tasks with pagination and filters

    Args:
        page: Page number (1-indexed)
        page_size: Number of tasks per page
        status: Filter by status
        priority: Filter by priority
        tags: Filter by tags (comma-separated)
        search: Text search in title/description

    Returns:
        Paginated list of tasks
    """
    try:
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",")] if tags else None

        # Get tasks
        tasks, total = await task_repository.list(
            page=page,
            page_size=page_size,
            status=status,
            priority=priority,
            tags=tag_list,
            search=search
        )

        # Calculate total pages
        total_pages = (total + page_size - 1) // page_size

        return TaskListResponse(
            tasks=tasks,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing tasks: {str(e)}"
        )


@app.get("/api/tasks/{task_id}", response_model=Task, tags=["Tasks"])
async def get_task(task_id: str):
    """
    Get specific task by ID

    Args:
        task_id: Task identifier

    Returns:
        Task details
    """
    try:
        task = await task_repository.get_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=404,
                detail=f"Task not found: {task_id}"
            )
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving task: {str(e)}"
        )


@app.put("/api/tasks/{task_id}", response_model=Task, tags=["Tasks"])
async def update_task(task_id: str, task_update: TaskUpdate):
    """
    Update task

    Args:
        task_id: Task identifier
        task_update: Update data

    Returns:
        Updated task
    """
    try:
        task = await task_repository.update(task_id, task_update)
        if not task:
            raise HTTPException(
                status_code=404,
                detail=f"Task not found: {task_id}"
            )
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating task: {str(e)}"
        )


@app.delete("/api/tasks/{task_id}", tags=["Tasks"])
async def delete_task(task_id: str):
    """
    Delete task

    Args:
        task_id: Task identifier

    Returns:
        Success status
    """
    try:
        deleted = await task_repository.delete(task_id)
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail=f"Task not found: {task_id}"
            )
        return {"status": "success", "message": f"Task {task_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting task: {str(e)}"
        )


@app.post("/api/tasks/bulk-delete", tags=["Tasks"])
async def bulk_delete_tasks(request: TaskBulkDeleteRequest):
    """
    Bulk delete tasks

    Args:
        request: Bulk delete request with task IDs

    Returns:
        Number of tasks deleted
    """
    try:
        deleted_count = await task_repository.bulk_delete(request.task_ids)
        return {
            "status": "success",
            "deleted_count": deleted_count,
            "message": f"Successfully deleted {deleted_count} task(s)"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error bulk deleting tasks: {str(e)}"
        )


@app.patch("/api/tasks/{task_id}/status", response_model=Task, tags=["Tasks"])
async def update_task_status(task_id: str, status_update: TaskStatusUpdate):
    """
    Quick status update for a task

    Args:
        task_id: Task identifier
        status_update: New status

    Returns:
        Updated task
    """
    try:
        task = await task_repository.update_status(task_id, status_update.status)
        if not task:
            raise HTTPException(
                status_code=404,
                detail=f"Task not found: {task_id}"
            )
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating task status: {str(e)}"
        )


@app.get("/api/tasks/tags/list", response_model=List[str], tags=["Tasks"])
async def get_task_tags():
    """
    Get all unique task tags

    Returns:
        List of unique tags
    """
    try:
        tags = await task_repository.get_all_tags()
        return tags
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving task tags: {str(e)}"
        )


@app.get("/api/tasks/stats/summary", response_model=TaskStatsResponse, tags=["Tasks"])
async def get_task_stats():
    """
    Get task statistics

    Returns:
        Task statistics including counts by status and priority
    """
    try:
        stats = await task_repository.get_stats()
        return TaskStatsResponse(**stats)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving task statistics: {str(e)}"
        )


# =============================================================================
# REMINDER ENDPOINTS
# =============================================================================

@app.post("/api/reminders/create", response_model=Reminder, tags=["Reminders"])
async def create_reminder(reminder_data: ReminderCreate):
    """
    Create a new reminder
    
    Args:
        reminder_data: Reminder creation data
        
    Returns:
        Created reminder
    """
    try:
        await reminder_repository.ensure_indexes()
        reminder = await reminder_repository.create(reminder_data)
        return reminder
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating reminder: {str(e)}"
        )


@app.get("/api/reminders/list", response_model=ReminderListResponse, tags=["Reminders"])
async def list_reminders(
    page: int = 1,
    page_size: int = 20,
    status: Optional[ReminderStatus] = None,
    priority: Optional[ReminderPriority] = None,
    tags: Optional[str] = None,
    search: Optional[str] = None,
    due_before: Optional[str] = None,
    due_after: Optional[str] = None,
    overdue_only: bool = False,
    pending_only: bool = False
):
    """
    List reminders with pagination and filters
    
    Args:
        page: Page number (1-based)
        page_size: Items per page (max 100)
        status: Filter by status
        priority: Filter by priority
        tags: Comma-separated list of tags to filter by
        search: Search in title and description
        due_before: Filter reminders due before this ISO date
        due_after: Filter reminders due after this ISO date
        overdue_only: Show only overdue reminders
        pending_only: Show only pending reminders
        
    Returns:
        Paginated list of reminders
    """
    try:
        # Validate page size
        if page_size > 100:
            page_size = 100
        
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",")] if tags else None
        
        # Parse dates
        from datetime import datetime
        due_before_dt = datetime.fromisoformat(due_before.replace('Z', '+00:00')) if due_before else None
        due_after_dt = datetime.fromisoformat(due_after.replace('Z', '+00:00')) if due_after else None
        
        result = await reminder_repository.list(
            page=page,
            page_size=page_size,
            status=status,
            priority=priority,
            tags=tag_list,
            search=search,
            due_before=due_before_dt,
            due_after=due_after_dt,
            overdue_only=overdue_only,
            pending_only=pending_only
        )
        
        return ReminderListResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing reminders: {str(e)}"
        )


@app.get("/api/reminders/pending", response_model=List[Reminder], tags=["Reminders"])
async def get_pending_reminders(limit: int = 50):
    """
    Get pending/due reminders
    
    Args:
        limit: Maximum number of reminders to return
        
    Returns:
        List of pending reminders that should be shown/notified
    """
    try:
        reminders = await reminder_repository.get_pending_reminders(limit)
        return reminders
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving pending reminders: {str(e)}"
        )


@app.get("/api/reminders/{reminder_id}", response_model=Reminder, tags=["Reminders"])
async def get_reminder(reminder_id: str):
    """
    Get specific reminder by ID
    
    Args:
        reminder_id: Reminder identifier
        
    Returns:
        Reminder details
    """
    try:
        reminder = await reminder_repository.get_by_id(reminder_id)
        if not reminder:
            raise HTTPException(
                status_code=404,
                detail="Reminder not found"
            )
        return reminder
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving reminder: {str(e)}"
        )


@app.put("/api/reminders/{reminder_id}", response_model=Reminder, tags=["Reminders"])
async def update_reminder(reminder_id: str, reminder_update: ReminderUpdate):
    """
    Update reminder
    
    Args:
        reminder_id: Reminder identifier
        reminder_update: Update data
        
    Returns:
        Updated reminder
    """
    try:
        reminder = await reminder_repository.update(reminder_id, reminder_update)
        if not reminder:
            raise HTTPException(
                status_code=404,
                detail="Reminder not found"
            )
        return reminder
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating reminder: {str(e)}"
        )


@app.delete("/api/reminders/{reminder_id}", tags=["Reminders"])
async def delete_reminder(reminder_id: str):
    """
    Delete reminder
    
    Args:
        reminder_id: Reminder identifier
        
    Returns:
        Success message
    """
    try:
        deleted = await reminder_repository.delete(reminder_id)
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Reminder not found"
            )
        return {"message": "Reminder deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting reminder: {str(e)}"
        )


@app.post("/api/reminders/bulk-delete", tags=["Reminders"])
async def bulk_delete_reminders(request: ReminderBulkDeleteRequest):
    """
    Bulk delete reminders
    
    Args:
        request: List of reminder IDs to delete
        
    Returns:
        Number of reminders deleted
    """
    try:
        deleted_count = await reminder_repository.bulk_delete(request.reminder_ids)
        return {
            "message": f"Successfully deleted {deleted_count} reminders",
            "deleted_count": deleted_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error bulk deleting reminders: {str(e)}"
        )


@app.patch("/api/reminders/{reminder_id}/complete", tags=["Reminders"])
async def complete_reminder(reminder_id: str):
    """
    Mark reminder as completed
    
    Args:
        reminder_id: Reminder identifier
        
    Returns:
        Success message
    """
    try:
        updated = await reminder_repository.update_status(reminder_id, ReminderStatus.COMPLETED)
        if not updated:
            raise HTTPException(
                status_code=404,
                detail="Reminder not found"
            )
        return {"message": "Reminder marked as completed"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error completing reminder: {str(e)}"
        )


@app.patch("/api/reminders/{reminder_id}/snooze", tags=["Reminders"])
async def snooze_reminder(reminder_id: str, snooze_request: SnoozeRequest):
    """
    Snooze reminder
    
    Args:
        reminder_id: Reminder identifier
        snooze_request: Snooze configuration
        
    Returns:
        Success message
    """
    try:
        snoozed = await reminder_repository.snooze(reminder_id, snooze_request.snooze_until)
        if not snoozed:
            raise HTTPException(
                status_code=404,
                detail="Reminder not found"
            )
        return {"message": f"Reminder snoozed until {snooze_request.snooze_until}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error snoozing reminder: {str(e)}"
        )


@app.get("/api/reminders/tags/list", response_model=List[str], tags=["Reminders"])
async def get_reminder_tags():
    """
    Get all unique reminder tags
    
    Returns:
        List of unique tags
    """
    try:
        tags = await reminder_repository.get_all_tags()
        return tags
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving reminder tags: {str(e)}"
        )


@app.get("/api/reminders/stats/summary", response_model=ReminderStatsResponse, tags=["Reminders"])
async def get_reminder_stats():
    """
    Get reminder statistics
    
    Returns:
        Reminder statistics including counts by status and priority
    """
    try:
        stats = await reminder_repository.get_stats()
        return ReminderStatsResponse(**stats)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving reminder statistics: {str(e)}"
        )


# ==================== PROMPT TEMPLATE ENDPOINTS ====================

@app.post("/api/prompt-templates/create", response_model=PromptTemplate, tags=["Prompt Templates"])
async def create_prompt_template(template_data: PromptTemplateCreate):
    """
    Create a new custom prompt template
    
    Args:
        template_data: Template creation data
        
    Returns:
        Created template with usage tracking fields
    """
    try:
        await prompt_template_repository.initialize()
        template = await prompt_template_repository.create(template_data)
        return template
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating template: {str(e)}"
        )


@app.get("/api/prompt-templates/list", response_model=List[PromptTemplate], tags=["Prompt Templates"])
async def list_prompt_templates(
    category: Optional[str] = None,
    is_system: Optional[bool] = None,
    is_custom: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
):
    """
    List prompt templates with optional filters
    
    Args:
        category: Filter by category (rag, tasks, reminders, memory, code, research, writing, custom)
        is_system: Filter system templates
        is_custom: Filter custom templates
        skip: Number of templates to skip (pagination)
        limit: Maximum number of templates to return
        
    Returns:
        List of matching templates
    """
    try:
        templates = await prompt_template_repository.list(
            category=category,
            is_system=is_system,
            is_custom=is_custom,
            skip=skip,
            limit=limit
        )
        return templates
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing templates: {str(e)}"
        )


@app.get("/api/prompt-templates/popular", response_model=List[PromptTemplate], tags=["Prompt Templates"])
async def get_popular_templates(limit: int = 6):
    """
    Get most popular templates sorted by ranking score
    
    Ranking formula: (click_count * 0.4) + (recency * 0.3) + (success_rate * 0.3)
    
    Args:
        limit: Maximum number of templates to return
        
    Returns:
        List of top-ranked templates
    """
    try:
        templates = await prompt_template_repository.get_popular(limit=limit)
        return templates
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting popular templates: {str(e)}"
        )


@app.get("/api/prompt-templates/recent", response_model=List[PromptTemplate], tags=["Prompt Templates"])
async def get_recent_templates(limit: int = 5):
    """
    Get recently used templates
    
    Args:
        limit: Maximum number of templates to return
        
    Returns:
        List of recently used templates sorted by last_used_at
    """
    try:
        templates = await prompt_template_repository.get_recent(limit=limit)
        return templates
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting recent templates: {str(e)}"
        )


@app.get("/api/prompt-templates/{template_id}", response_model=PromptTemplate, tags=["Prompt Templates"])
async def get_prompt_template(template_id: str):
    """
    Get a specific prompt template by ID
    
    Args:
        template_id: Template unique identifier
        
    Returns:
        Template details
    """
    try:
        template = await prompt_template_repository.get_by_id(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving template: {str(e)}"
        )


@app.put("/api/prompt-templates/{template_id}", response_model=PromptTemplate, tags=["Prompt Templates"])
async def update_prompt_template(template_id: str, template_data: PromptTemplateUpdate):
    """
    Update a custom prompt template
    
    Only custom templates can be updated (not system templates)
    
    Args:
        template_id: Template unique identifier
        template_data: Fields to update
        
    Returns:
        Updated template
    """
    try:
        template = await prompt_template_repository.update(template_id, template_data)
        if not template:
            raise HTTPException(
                status_code=404,
                detail="Template not found or cannot be updated (system templates are read-only)"
            )
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating template: {str(e)}"
        )


@app.delete("/api/prompt-templates/{template_id}", tags=["Prompt Templates"])
async def delete_prompt_template(template_id: str):
    """
    Delete a custom prompt template
    
    Only custom templates can be deleted (not system templates)
    
    Args:
        template_id: Template unique identifier
        
    Returns:
        Success message
    """
    try:
        deleted = await prompt_template_repository.delete(template_id)
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Template not found or cannot be deleted (system templates are read-only)"
            )
        return {"message": "Template deleted successfully", "template_id": template_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting template: {str(e)}"
        )


@app.post("/api/prompt-templates/{template_id}/track-usage", response_model=PromptTemplate, tags=["Prompt Templates"])
async def track_template_usage(template_id: str, usage_data: PromptTemplateUsageTrack):
    """
    Track template usage and update statistics
    
    Increments click count, updates last_used_at, and recalculates success rate
    
    Args:
        template_id: Template unique identifier
        usage_data: Usage tracking data (success/failure)
        
    Returns:
        Updated template with new usage statistics
    """
    try:
        template = await prompt_template_repository.track_usage(
            template_id,
            success=usage_data.success
        )
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error tracking template usage: {str(e)}"
        )


@app.get("/api/prompt-templates/categories/list", response_model=List[str], tags=["Prompt Templates"])
async def get_template_categories():
    """
    Get all available template categories
    
    Returns:
        List of unique categories from existing templates
    """
    try:
        categories = await prompt_template_repository.get_categories()
        return categories
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving categories: {str(e)}"
        )


@app.get("/api/prompt-templates/stats/summary", response_model=PromptTemplateStats, tags=["Prompt Templates"])
async def get_template_stats():
    """
    Get prompt template statistics
    
    Returns:
        Statistics including total templates, clicks, categories, and most popular template
    """
    try:
        stats = await prompt_template_repository.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving template statistics: {str(e)}"
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
    
    # Initialize prompt template repository indexes
    try:
        await prompt_template_repository.initialize()
        print("✅ Prompt template repository initialized")
    except Exception as e:
        print(f"⚠️ Warning: Failed to initialize prompt template repository: {e}")


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
