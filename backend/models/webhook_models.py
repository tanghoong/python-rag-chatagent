"""
Webhook Models Module

Pydantic models for outgoing webhook system.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from enum import Enum


class WebhookEvent(str, Enum):
    """Webhook event types"""
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_COMPLETED = "task_completed"
    TASK_DELETED = "task_deleted"
    REMINDER_CREATED = "reminder_created"
    REMINDER_DUE = "reminder_due"
    REMINDER_COMPLETED = "reminder_completed"
    CHAT_MESSAGE = "chat_message"
    CUSTOM = "custom"


class WebhookStatus(str, Enum):
    """Webhook configuration status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISABLED = "disabled"


class WebhookAuthType(str, Enum):
    """Webhook authentication types"""
    NONE = "none"
    BEARER = "bearer"
    BASIC = "basic"
    API_KEY = "api_key"


class WebhookBase(BaseModel):
    """Base webhook configuration model"""
    name: str = Field(..., min_length=1, max_length=200, description="Webhook name")
    url: str = Field(..., description="Webhook URL endpoint")
    description: Optional[str] = Field(None, max_length=1000, description="Webhook description")
    events: List[WebhookEvent] = Field(default_factory=list, description="Events that trigger this webhook")
    status: WebhookStatus = Field(default=WebhookStatus.ACTIVE, description="Webhook status")
    
    # Authentication
    auth_type: WebhookAuthType = Field(default=WebhookAuthType.NONE, description="Authentication type")
    auth_token: Optional[str] = Field(None, description="Authentication token (bearer/api key)")
    auth_username: Optional[str] = Field(None, description="Basic auth username")
    auth_password: Optional[str] = Field(None, description="Basic auth password")
    
    # Custom headers
    headers: Dict[str, str] = Field(default_factory=dict, description="Custom HTTP headers")
    
    # Retry configuration
    retry_enabled: bool = Field(default=True, description="Enable retry on failure")
    retry_count: int = Field(default=3, ge=0, le=10, description="Number of retry attempts")
    timeout_seconds: int = Field(default=30, ge=1, le=300, description="Request timeout in seconds")
    
    # Filtering
    tags: List[str] = Field(default_factory=list, description="Webhook tags for organization")


class WebhookCreate(WebhookBase):
    """Model for creating a new webhook"""
    pass


class WebhookUpdate(BaseModel):
    """Model for updating a webhook (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    url: Optional[str] = None
    description: Optional[str] = Field(None, max_length=1000)
    events: Optional[List[WebhookEvent]] = None
    status: Optional[WebhookStatus] = None
    auth_type: Optional[WebhookAuthType] = None
    auth_token: Optional[str] = None
    auth_username: Optional[str] = None
    auth_password: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    retry_enabled: Optional[bool] = None
    retry_count: Optional[int] = Field(None, ge=0, le=10)
    timeout_seconds: Optional[int] = Field(None, ge=1, le=300)
    tags: Optional[List[str]] = None


class Webhook(WebhookBase):
    """Complete webhook model with metadata"""
    id: str = Field(..., description="Unique webhook identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    user_id: Optional[str] = Field(default="default_user", description="User ID")
    
    # Statistics
    total_triggers: int = Field(default=0, description="Total number of times triggered")
    success_count: int = Field(default=0, description="Successful execution count")
    failure_count: int = Field(default=0, description="Failed execution count")
    last_triggered_at: Optional[datetime] = Field(None, description="Last trigger timestamp")
    last_success_at: Optional[datetime] = Field(None, description="Last successful execution timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "webhook_abc123",
                "name": "Slack Notification",
                "url": "https://hooks.slack.com/services/xxx/yyy/zzz",
                "description": "Send notifications to Slack channel",
                "events": ["task_completed", "reminder_due"],
                "status": "active",
                "auth_type": "none",
                "headers": {"Content-Type": "application/json"},
                "retry_enabled": True,
                "retry_count": 3,
                "timeout_seconds": 30,
                "tags": ["slack", "notifications"],
                "created_at": "2024-01-15T10:00:00Z",
                "updated_at": "2024-01-15T14:30:00Z",
                "user_id": "default_user",
                "total_triggers": 42,
                "success_count": 40,
                "failure_count": 2,
                "last_triggered_at": "2024-01-15T14:30:00Z",
                "last_success_at": "2024-01-15T14:30:00Z"
            }
        }


class WebhookLogStatus(str, Enum):
    """Webhook execution log status"""
    SUCCESS = "success"
    FAILURE = "failure"
    PENDING = "pending"
    RETRYING = "retrying"


class WebhookLog(BaseModel):
    """Webhook execution log"""
    id: str = Field(..., description="Unique log identifier")
    webhook_id: str = Field(..., description="Associated webhook ID")
    event_type: WebhookEvent = Field(..., description="Event that triggered the webhook")
    status: WebhookLogStatus = Field(..., description="Execution status")
    
    # Request details
    request_url: str = Field(..., description="Request URL")
    request_payload: Dict[str, Any] = Field(default_factory=dict, description="Request payload")
    request_headers: Dict[str, str] = Field(default_factory=dict, description="Request headers")
    
    # Response details
    response_status_code: Optional[int] = Field(None, description="HTTP response status code")
    response_body: Optional[str] = Field(None, description="Response body")
    response_time_ms: Optional[int] = Field(None, description="Response time in milliseconds")
    
    # Error details
    error_message: Optional[str] = Field(None, description="Error message if failed")
    retry_attempt: int = Field(default=0, description="Retry attempt number")
    
    # Metadata
    triggered_at: datetime = Field(default_factory=datetime.utcnow, description="Trigger timestamp")
    user_id: Optional[str] = Field(default="default_user", description="User ID")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "log_xyz789",
                "webhook_id": "webhook_abc123",
                "event_type": "task_completed",
                "status": "success",
                "request_url": "https://hooks.slack.com/services/xxx/yyy/zzz",
                "request_payload": {"text": "Task completed: Review PR"},
                "request_headers": {"Content-Type": "application/json"},
                "response_status_code": 200,
                "response_body": "ok",
                "response_time_ms": 150,
                "retry_attempt": 0,
                "triggered_at": "2024-01-15T14:30:00Z",
                "user_id": "default_user"
            }
        }


class WebhookListResponse(BaseModel):
    """Response model for listing webhooks"""
    webhooks: List[Webhook]
    total: int
    page: int
    page_size: int
    total_pages: int


class WebhookLogsResponse(BaseModel):
    """Response model for listing webhook logs"""
    logs: List[WebhookLog]
    total: int
    page: int
    page_size: int
    total_pages: int


class WebhookStatsResponse(BaseModel):
    """Response model for webhook statistics"""
    total_webhooks: int
    active_webhooks: int
    inactive_webhooks: int
    total_triggers: int
    total_success: int
    total_failures: int
    success_rate: float


class BulkDeleteRequest(BaseModel):
    """Request model for bulk deleting webhooks"""
    webhook_ids: List[str] = Field(..., min_length=1, description="List of webhook IDs to delete")


class WebhookTestRequest(BaseModel):
    """Request model for testing a webhook"""
    payload: Dict[str, Any] = Field(default_factory=dict, description="Test payload to send")


class WebhookTestResponse(BaseModel):
    """Response model for webhook test"""
    success: bool
    status_code: Optional[int] = None
    response_body: Optional[str] = None
    response_time_ms: Optional[int] = None
    error_message: Optional[str] = None
