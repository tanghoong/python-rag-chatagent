"""
Prompt Template Models

Defines data models for the prompt template system that helps users
start conversations faster with pre-defined, customizable templates.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class PromptTemplateBase(BaseModel):
    """Base model for prompt templates"""
    title: str = Field(..., min_length=3, max_length=100, description="Template title")
    prompt_text: str = Field(..., min_length=10, max_length=2000, description="Template prompt text")
    category: str = Field(..., description="Template category (rag, tasks, reminders, memory, code, research, writing, custom)")
    agent_capability: Optional[str] = Field(None, description="Associated agent capability")
    is_system: bool = Field(default=False, description="Whether this is a system-provided template")
    is_custom: bool = Field(default=True, description="Whether this is a user-created template")
    tags: Optional[List[str]] = Field(default_factory=list, description="Template tags for filtering")


class PromptTemplateCreate(PromptTemplateBase):
    """Model for creating a new prompt template"""
    pass


class PromptTemplateUpdate(BaseModel):
    """Model for updating an existing prompt template"""
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    prompt_text: Optional[str] = Field(None, min_length=10, max_length=2000)
    category: Optional[str] = None
    agent_capability: Optional[str] = None
    tags: Optional[List[str]] = None


class PromptTemplate(PromptTemplateBase):
    """Complete prompt template model with all fields"""
    id: str = Field(..., description="Template unique identifier")
    user_id: str = Field(default="default_user", description="User who created the template")
    
    # Usage tracking
    click_count: int = Field(default=0, description="Number of times template was clicked")
    last_used_at: Optional[datetime] = Field(None, description="Last time template was used")
    success_rate: float = Field(default=0.0, description="Success rate (0-1) of template leading to conversation")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "tpl_abc123",
                "title": "Summarize My Documents",
                "prompt_text": "Please summarize all the key points from the documents in my collection about {topic}",
                "category": "rag",
                "agent_capability": "document_search",
                "is_system": True,
                "is_custom": False,
                "tags": ["summary", "documents", "rag"],
                "user_id": "default_user",
                "click_count": 42,
                "last_used_at": "2025-10-29T10:30:00",
                "success_rate": 0.85,
                "created_at": "2025-10-01T00:00:00",
                "updated_at": "2025-10-29T10:30:00"
            }
        }


class PromptTemplateStats(BaseModel):
    """Statistics for prompt templates"""
    total_templates: int
    system_templates: int
    custom_templates: int
    total_clicks: int
    categories: dict[str, int]
    most_popular: Optional[PromptTemplate] = None


class PromptTemplateUsageTrack(BaseModel):
    """Model for tracking template usage"""
    template_id: str
    success: bool = Field(default=True, description="Whether the template led to a successful conversation")
