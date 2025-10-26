"""
Task Models Module

Pydantic models for task management system.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class TaskStatus(str, Enum):
    """Task status enumeration"""
    TODO = "todo"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Task priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskBase(BaseModel):
    """Base task model with common fields"""
    title: str = Field(..., min_length=1, max_length=500, description="Task title")
    description: Optional[str] = Field(None, max_length=5000, description="Task description")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Task status")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority")
    tags: List[str] = Field(default_factory=list, description="Task tags")


class TaskCreate(TaskBase):
    """Model for creating a new task"""
    pass


class TaskUpdate(BaseModel):
    """Model for updating a task (all fields optional)"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    tags: Optional[List[str]] = None


class TaskStatusUpdate(BaseModel):
    """Model for quick status update"""
    status: TaskStatus


class Task(TaskBase):
    """Complete task model with metadata"""
    id: str = Field(..., description="Unique task identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    user_id: Optional[str] = Field(default="default_user", description="User ID (for multi-user support)")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "task_abc123",
                "title": "Implement task management feature",
                "description": "Create backend and frontend for task management",
                "status": "in-progress",
                "priority": "high",
                "tags": ["development", "feature"],
                "created_at": "2024-01-15T10:00:00Z",
                "updated_at": "2024-01-15T14:30:00Z",
                "user_id": "default_user"
            }
        }


class TaskListResponse(BaseModel):
    """Response model for task list with pagination"""
    tasks: List[Task]
    total: int
    page: int
    page_size: int
    total_pages: int


class TaskStatsResponse(BaseModel):
    """Response model for task statistics"""
    total: int
    todo: int
    in_progress: int
    completed: int
    cancelled: int
    by_priority: dict
    recent_completed: int  # Tasks completed in last 7 days


class BulkDeleteRequest(BaseModel):
    """Request model for bulk delete operations"""
    task_ids: List[str] = Field(..., min_items=1, description="List of task IDs to delete")
