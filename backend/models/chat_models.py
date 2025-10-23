"""
Pydantic models for chat sessions and messages
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom type for MongoDB ObjectId validation"""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class Message(BaseModel):
    """Individual message within a chat session"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[dict] = Field(default=None, description="Optional metadata (tools used, etc.)")

    class Config:
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class ChatSession(BaseModel):
    """Chat session containing multiple messages"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str = Field(default="New Chat", description="Auto-generated or user-set title")
    messages: List[Message] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[dict] = Field(default=None, description="Session metadata")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class CreateChatRequest(BaseModel):
    """Request model for creating a new chat session"""
    title: Optional[str] = Field(default="New Chat")
    metadata: Optional[dict] = None


class ChatSessionResponse(BaseModel):
    """Response model for chat session (without full message history)"""
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChatDetailResponse(BaseModel):
    """Response model for full chat session with messages"""
    id: str
    title: str
    messages: List[Message]
    created_at: datetime
    updated_at: datetime
    metadata: Optional[dict] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
