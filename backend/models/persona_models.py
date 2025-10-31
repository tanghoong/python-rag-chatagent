"""
Pydantic models for AI agent personas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId


class Persona(BaseModel):
    """AI Agent Persona with customizable behavior"""
    id: Optional[str] = Field(default=None, alias="_id")
    name: str = Field(..., min_length=1, max_length=100, description="Persona name")
    description: str = Field(..., min_length=1, max_length=500, description="Brief description of persona")
    system_prompt: str = Field(..., min_length=10, max_length=10000, description="Custom system prompt")
    temperature: float = Field(default=0.2, ge=0.0, le=2.0, description="LLM temperature (0.0-2.0)")
    model_preference: Optional[str] = Field(default=None, description="Preferred model (gpt-4o-mini, gemini-2.0-flash-exp, etc.)")
    provider_preference: Optional[str] = Field(default=None, description="Preferred provider (openai, google)")
    capabilities: List[str] = Field(default_factory=list, description="List of capabilities (coding, research, teaching, etc.)")
    is_system: bool = Field(default=False, description="Whether this is a system-provided persona")
    is_active: bool = Field(default=True, description="Whether this persona is active")
    created_by: Optional[str] = Field(default=None, description="User ID who created this persona")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    use_count: int = Field(default=0, description="Number of times this persona has been used")
    avatar_emoji: Optional[str] = Field(default="🤖", description="Emoji avatar for persona")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class PersonaCreate(BaseModel):
    """Request model for creating a persona"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    system_prompt: str = Field(..., min_length=10, max_length=10000)
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    model_preference: Optional[str] = None
    provider_preference: Optional[str] = None
    capabilities: List[str] = Field(default_factory=list)
    avatar_emoji: Optional[str] = "🤖"
    tags: List[str] = Field(default_factory=list)


class PersonaUpdate(BaseModel):
    """Request model for updating a persona"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    system_prompt: Optional[str] = Field(None, min_length=10, max_length=10000)
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    model_preference: Optional[str] = None
    provider_preference: Optional[str] = None
    capabilities: Optional[List[str]] = None
    avatar_emoji: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class PersonaResponse(BaseModel):
    """Response model for persona"""
    id: str
    name: str
    description: str
    system_prompt: str
    temperature: float
    model_preference: Optional[str]
    provider_preference: Optional[str]
    capabilities: List[str]
    is_system: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    use_count: int
    avatar_emoji: str
    tags: List[str]

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class PersonaListResponse(BaseModel):
    """Response model for persona list (without full system prompt)"""
    id: str
    name: str
    description: str
    temperature: float
    capabilities: List[str]
    is_system: bool
    is_active: bool
    use_count: int
    avatar_emoji: str
    tags: List[str]

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
