"""
Pydantic models for settings management
Supports environment, config file, and project-based settings
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
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


class LLMSettings(BaseModel):
    """LLM Provider Configuration"""
    provider: str = Field(default="openai", description="LLM provider: 'openai' or 'google'")
    auto_switch: bool = Field(default=True, description="Auto-switch between models based on complexity")
    google_api_key: Optional[str] = Field(default=None, description="Google Gemini API key")
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")


class VectorDBSettings(BaseModel):
    """Vector Database Configuration"""
    path: str = Field(default="./data/vectordb", description="Path to vector database")
    embedding_provider: str = Field(default="openai", description="Embedding provider: 'openai' or 'google'")


class MongoDBSettings(BaseModel):
    """MongoDB Configuration"""
    uri: str = Field(default="mongodb://localhost:27017/rag_chatbot", description="MongoDB connection URI")
    db_name: str = Field(default="rag_chatbot", description="Database name")
    posts_collection: str = Field(default="personal_posts", description="Posts collection name")
    chats_collection: str = Field(default="chat_sessions", description="Chats collection name")


class APISettings(BaseModel):
    """API Server Configuration"""
    host: str = Field(default="0.0.0.0", description="API host")
    port: int = Field(default=8000, description="API port")
    cors_origins: List[str] = Field(
        default=["http://localhost:5173", "http://127.0.0.1:5173"],
        description="CORS allowed origins"
    )


class AppSettings(BaseModel):
    """Complete Application Settings"""
    llm: LLMSettings = Field(default_factory=LLMSettings)
    vector_db: VectorDBSettings = Field(default_factory=VectorDBSettings)
    mongodb: MongoDBSettings = Field(default_factory=MongoDBSettings)
    api: APISettings = Field(default_factory=APISettings)


class ProjectSettings(BaseModel):
    """Project-specific settings stored in MongoDB"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    project_name: str = Field(..., description="Unique project identifier")
    settings: AppSettings = Field(..., description="Project-specific settings")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = Field(default=None, description="Project description")
    is_active: bool = Field(default=True, description="Whether this project is active")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class ProjectSettingsResponse(BaseModel):
    """Response model for project settings"""
    id: str
    project_name: str
    settings: AppSettings
    created_at: datetime
    updated_at: datetime
    description: Optional[str] = None
    is_active: bool = True


class ProjectSettingsCreate(BaseModel):
    """Request model for creating project settings"""
    project_name: str = Field(..., description="Unique project identifier")
    settings: Optional[AppSettings] = Field(default=None, description="Project settings (uses defaults if not provided)")
    description: Optional[str] = Field(default=None, description="Project description")


class ProjectSettingsUpdate(BaseModel):
    """Request model for updating project settings"""
    settings: Optional[AppSettings] = Field(default=None, description="Updated settings")
    description: Optional[str] = Field(default=None, description="Updated description")
    is_active: Optional[bool] = Field(default=None, description="Updated active status")


class SettingsSource(BaseModel):
    """Information about where a setting value came from"""
    key: str
    value: Any
    source: str = Field(..., description="Source: 'environment', 'config_file', 'project', or 'default'")
