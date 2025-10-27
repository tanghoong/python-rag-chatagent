"""
Reminder Models Module

Pydantic models for reminder management system.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class ReminderStatus(str, Enum):
    """Reminder status enumeration"""
    PENDING = "pending"
    COMPLETED = "completed"
    SNOOZED = "snoozed"
    CANCELLED = "cancelled"


class ReminderPriority(str, Enum):
    """Reminder priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class RecurrenceType(str, Enum):
    """Recurrence type enumeration"""
    NONE = "none"
    MINUTELY = "minutely"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ReminderBase(BaseModel):
    """Base reminder model"""
    title: str = Field(..., min_length=1, max_length=500, description="Reminder title")
    description: Optional[str] = Field(None, max_length=5000, description="Reminder description")
    due_date: datetime = Field(..., description="When the reminder should trigger")
    status: ReminderStatus = Field(default=ReminderStatus.PENDING, description="Reminder status")
    priority: ReminderPriority = Field(default=ReminderPriority.MEDIUM, description="Reminder priority")
    tags: List[str] = Field(default_factory=list, description="Reminder tags")
    
    # Recurrence settings
    recurrence_type: RecurrenceType = Field(default=RecurrenceType.NONE, description="Recurrence pattern")
    recurrence_interval: int = Field(default=1, ge=1, description="Recurrence interval (e.g., every 2 days)")
    recurrence_end_date: Optional[datetime] = Field(None, description="When recurrence should stop")
    recurrence_count: Optional[int] = Field(None, ge=1, description="How many times to repeat")
    
    # Weekly recurrence specific
    recurrence_days_of_week: List[int] = Field(default_factory=list, description="Days of week for weekly recurrence (0=Monday)")
    
    # Monthly recurrence specific
    recurrence_day_of_month: Optional[int] = Field(None, ge=1, le=31, description="Day of month for monthly recurrence")


class ReminderCreate(ReminderBase):
    """Model for creating a new reminder"""
    pass


class ReminderUpdate(BaseModel):
    """Model for updating a reminder"""
    title: Optional[str] = Field(None, min_length=1, max_length=500, description="Reminder title")
    description: Optional[str] = Field(None, max_length=5000, description="Reminder description")
    due_date: Optional[datetime] = Field(None, description="When the reminder should trigger")
    status: Optional[ReminderStatus] = Field(None, description="Reminder status")
    priority: Optional[ReminderPriority] = Field(None, description="Reminder priority")
    tags: Optional[List[str]] = Field(None, description="Reminder tags")
    
    # Recurrence settings
    recurrence_type: Optional[RecurrenceType] = Field(None, description="Recurrence pattern")
    recurrence_interval: Optional[int] = Field(None, ge=1, description="Recurrence interval")
    recurrence_end_date: Optional[datetime] = Field(None, description="When recurrence should stop")
    recurrence_count: Optional[int] = Field(None, ge=1, description="How many times to repeat")
    recurrence_days_of_week: Optional[List[int]] = Field(None, description="Days of week for weekly recurrence")
    recurrence_day_of_month: Optional[int] = Field(None, ge=1, le=31, description="Day of month for monthly recurrence")
    
    # Snooze settings
    snooze_until: Optional[datetime] = Field(None, description="When snoozed reminder should reappear")


class Reminder(ReminderBase):
    """Complete reminder model with metadata"""
    id: str = Field(..., description="Unique reminder identifier")
    created_by: str = Field(default="default_user", description="User who created the reminder")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    completed_at: Optional[datetime] = Field(None, description="When reminder was completed")
    snooze_until: Optional[datetime] = Field(None, description="When snoozed reminder should reappear")
    
    # Recurrence tracking
    is_recurring: bool = Field(default=False, description="Whether this is a recurring reminder")
    parent_reminder_id: Optional[str] = Field(None, description="Parent reminder ID for recurring instances")
    next_occurrence: Optional[datetime] = Field(None, description="Next scheduled occurrence")
    occurrence_count: int = Field(default=0, description="How many times this has occurred")


class ReminderListResponse(BaseModel):
    """Response model for paginated reminder list"""
    reminders: List[Reminder]
    total: int
    page: int
    page_size: int
    total_pages: int


class ReminderStatsResponse(BaseModel):
    """Response model for reminder statistics"""
    total: int
    pending: int
    completed: int
    snoozed: int
    cancelled: int
    overdue: int
    due_today: int
    due_this_week: int
    by_priority: Dict[str, int]
    recent_completed: int  # Last 7 days


class BulkDeleteRequest(BaseModel):
    """Request model for bulk delete operations"""
    reminder_ids: List[str] = Field(..., min_items=1, description="List of reminder IDs to delete")


class SnoozeRequest(BaseModel):
    """Request model for snoozing a reminder"""
    snooze_until: datetime = Field(..., description="When the reminder should reappear")


class RecurrenceSettings(BaseModel):
    """Model for recurrence configuration"""
    type: RecurrenceType
    interval: int = Field(default=1, ge=1)
    end_date: Optional[datetime] = None
    count: Optional[int] = Field(None, ge=1)
    days_of_week: List[int] = Field(default_factory=list)  # 0=Monday, 6=Sunday
    day_of_month: Optional[int] = Field(None, ge=1, le=31)


class NotificationSettings(BaseModel):
    """Model for notification preferences"""
    browser_notifications: bool = Field(default=True, description="Enable browser notifications")
    sound_alerts: bool = Field(default=False, description="Enable sound alerts")
    advance_notification_minutes: int = Field(default=0, ge=0, description="Minutes before due to notify")