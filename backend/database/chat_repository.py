"""
Repository layer for chat session management
Handles CRUD operations for chat sessions and messages
"""
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from models.chat_models import ChatSession, Message, ChatSessionResponse, ChatDetailResponse
from database.connection import get_async_chats_collection


async def create_chat_session(title: str = "New Chat", metadata: Optional[dict] = None) -> str:
    """
    Create a new chat session
    
    Args:
        title: Chat session title
        metadata: Optional metadata dictionary
    
    Returns:
        str: Created chat session ID
    """
    collection: AsyncIOMotorCollection = get_async_chats_collection()
    
    chat_session = ChatSession(
        title=title,
        messages=[],
        metadata=metadata
    )
    
    # Convert to dict and prepare for insertion
    chat_dict = chat_session.model_dump(by_alias=True, exclude={"id"})
    
    result = await collection.insert_one(chat_dict)
    return str(result.inserted_id)


async def get_chat_session(chat_id: str) -> Optional[ChatDetailResponse]:
    """
    Get a specific chat session by ID
    
    Args:
        chat_id: Chat session ID
    
    Returns:
        ChatDetailResponse or None if not found
    """
    collection: AsyncIOMotorCollection = get_async_chats_collection()
    
    try:
        chat_data = await collection.find_one({"_id": ObjectId(chat_id)})
        
        if not chat_data:
            return None
        
        # Convert ObjectId to string for response
        chat_data["id"] = str(chat_data.pop("_id"))
        
        return ChatDetailResponse(**chat_data)
    except Exception as e:
        print(f"Error getting chat session: {e}")
        return None


async def list_chat_sessions(limit: int = 50, skip: int = 0) -> List[ChatSessionResponse]:
    """
    List all chat sessions (without full message history)
    
    Args:
        limit: Maximum number of sessions to return
        skip: Number of sessions to skip (pagination)
    
    Returns:
        List of ChatSessionResponse objects
    """
    collection: AsyncIOMotorCollection = get_async_chats_collection()
    
    cursor = collection.find().sort("updated_at", -1).skip(skip).limit(limit)
    
    sessions = []
    async for chat_data in cursor:
        sessions.append(ChatSessionResponse(
            id=str(chat_data["_id"]),
            title=chat_data.get("title", "New Chat"),
            created_at=chat_data["created_at"],
            updated_at=chat_data["updated_at"],
            message_count=len(chat_data.get("messages", []))
        ))
    
    return sessions


async def add_message(chat_id: str, message: Message) -> bool:
    """
    Add a message to a chat session
    
    Args:
        chat_id: Chat session ID
        message: Message object to add
    
    Returns:
        bool: True if successful, False otherwise
    """
    collection: AsyncIOMotorCollection = get_async_chats_collection()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$push": {"messages": message.model_dump()},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return result.modified_count > 0
    except Exception as e:
        print(f"Error adding message: {e}")
        return False


async def delete_chat_session(chat_id: str) -> bool:
    """
    Delete a chat session
    
    Args:
        chat_id: Chat session ID
    
    Returns:
        bool: True if deleted, False otherwise
    """
    collection: AsyncIOMotorCollection = get_async_chats_collection()
    
    try:
        result = await collection.delete_one({"_id": ObjectId(chat_id)})
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting chat session: {e}")
        return False


async def update_chat_title(chat_id: str, title: str) -> bool:
    """
    Update chat session title
    
    Args:
        chat_id: Chat session ID
        title: New title
    
    Returns:
        bool: True if successful, False otherwise
    """
    collection: AsyncIOMotorCollection = get_async_chats_collection()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$set": {
                    "title": title,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating chat title: {e}")
        return False


async def get_chat_messages(chat_id: str, limit: int = 10) -> List[Message]:
    """
    Get the last N messages from a chat session (for context)
    
    Args:
        chat_id: Chat session ID
        limit: Number of recent messages to return
    
    Returns:
        List of Message objects
    """
    collection: AsyncIOMotorCollection = get_async_chats_collection()
    
    try:
        chat_data = await collection.find_one(
            {"_id": ObjectId(chat_id)},
            {"messages": {"$slice": -limit}}
        )
        
        if not chat_data or "messages" not in chat_data:
            return []
        
        return [Message(**msg) for msg in chat_data["messages"]]
    except Exception as e:
        print(f"Error getting chat messages: {e}")
        return []


async def update_message(chat_id: str, message_id: str, content: str) -> bool:
    """
    Update a specific message content in a chat session
    
    Args:
        chat_id: Chat session ID
        message_id: Message ID to update
        content: New message content
    
    Returns:
        bool: True if successful, False otherwise
    """
    collection: AsyncIOMotorCollection = get_async_chats_collection()
    
    try:
        result = await collection.update_one(
            {
                "_id": ObjectId(chat_id),
                "messages.id": message_id
            },
            {
                "$set": {
                    "messages.$.content": content,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating message: {e}")
        return False


async def delete_message(chat_id: str, message_id: str) -> bool:
    """
    Delete a specific message from a chat session
    
    Args:
        chat_id: Chat session ID
        message_id: Message ID to delete
    
    Returns:
        bool: True if successful, False otherwise
    """
    collection: AsyncIOMotorCollection = get_async_chats_collection()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$pull": {"messages": {"id": message_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return result.modified_count > 0
    except Exception as e:
        print(f"Error deleting message: {e}")
        return False


async def regenerate_from_message(chat_id: str, message_id: str) -> bool:
    """
    Remove all messages after a specific message (for regeneration)
    
    Args:
        chat_id: Chat session ID
        message_id: Message ID to regenerate from
    
    Returns:
        bool: True if successful, False otherwise
    """
    collection: AsyncIOMotorCollection = get_async_chats_collection()
    
    try:
        # First, get the chat to find the message index
        chat_data = await collection.find_one({"_id": ObjectId(chat_id)})
        
        if not chat_data or "messages" not in chat_data:
            return False
        
        # Find the index of the message to regenerate from
        message_index = -1
        for i, msg in enumerate(chat_data["messages"]):
            if msg.get("id") == message_id:
                message_index = i
                break
        
        if message_index == -1:
            return False
        
        # Keep messages up to and including the target message
        messages_to_keep = chat_data["messages"][:message_index + 1]
        
        # Update the chat with truncated messages
        result = await collection.update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$set": {
                    "messages": messages_to_keep,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0
    except Exception as e:
        print(f"Error regenerating from message: {e}")
        return False
