"""
Reminder Repository Module

MongoDB repository for reminder CRUD operations with recurrence support.
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from models.reminder_models import (
    Reminder, ReminderCreate, ReminderUpdate, ReminderStatus, 
    ReminderPriority, RecurrenceType
)
import hashlib
import time
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/rag_chatbot")
DB_NAME = os.getenv("DB_NAME", "rag_chatbot")


class ReminderRepository:
    """Repository for reminder management operations"""

    def __init__(self):
        """Initialize reminder repository"""
        self._client = None
        self._db = None
        self._collection = None

    def _get_collection(self) -> AsyncIOMotorCollection:
        """Get MongoDB collection, creating fresh connection if needed"""
        # Create a new client for this event loop
        if self._client is None:
            self._client = AsyncIOMotorClient(MONGODB_URI)
            self._db = self._client[DB_NAME]
            self._collection = self._db["reminders"]
        return self._collection
    
    @property
    def collection(self) -> AsyncIOMotorCollection:
        """Property to get collection"""
        return self._get_collection()

    async def ensure_indexes(self):
        """Create indexes for better query performance"""
        try:
            # Create indexes
            await self.collection.create_index("id", unique=True)
            await self.collection.create_index("status")
            await self.collection.create_index("priority")
            await self.collection.create_index("due_date")
            await self.collection.create_index("created_at")
            await self.collection.create_index("updated_at")
            await self.collection.create_index("tags")
            await self.collection.create_index("snooze_until")
            await self.collection.create_index("next_occurrence")
            await self.collection.create_index("created_by")
            await self.collection.create_index("is_recurring")
            await self.collection.create_index([("title", "text"), ("description", "text")])
            print("✅ Reminder indexes created successfully")
        except Exception as e:
            print(f"⚠️ Reminder index creation warning: {e}")

    def _generate_reminder_id(self, title: str) -> str:
        """Generate unique reminder ID"""
        timestamp = str(time.time())
        unique_string = f"{title}_{timestamp}"
        hash_object = hashlib.md5(unique_string.encode())
        return f"rem_{hash_object.hexdigest()[:12]}"

    def _reminder_to_dict(self, reminder: Reminder) -> dict:
        """Convert Reminder model to dictionary for MongoDB"""
        reminder_dict = reminder.model_dump()
        # Convert datetime to string for MongoDB
        datetime_fields = ["created_at", "updated_at", "due_date", "completed_at", "snooze_until", "next_occurrence", "recurrence_end_date"]
        for field in datetime_fields:
            if reminder_dict.get(field) and isinstance(reminder_dict[field], datetime):
                reminder_dict[field] = reminder_dict[field].isoformat()
        return reminder_dict

    def _dict_to_reminder(self, doc: dict) -> Reminder:
        """Convert MongoDB document to Reminder model"""
        if doc is None:
            return None
        
        # Remove MongoDB _id field
        doc.pop("_id", None)
        
        # Convert string dates back to datetime
        datetime_fields = ["created_at", "updated_at", "due_date", "completed_at", "snooze_until", "next_occurrence", "recurrence_end_date"]
        for field in datetime_fields:
            if isinstance(doc.get(field), str):
                try:
                    doc[field] = datetime.fromisoformat(doc[field])
                except ValueError:
                    doc[field] = None
        
        return Reminder(**doc)

    async def create(self, reminder_data: ReminderCreate) -> Reminder:
        """
        Create a new reminder
        
        Args:
            reminder_data: Reminder creation data
            
        Returns:
            Created reminder
        """
        reminder_id = self._generate_reminder_id(reminder_data.title)
        now = datetime.utcnow()
        
        # Determine if this is recurring
        is_recurring = reminder_data.recurrence_type != RecurrenceType.NONE
        next_occurrence = None
        
        if is_recurring:
            next_occurrence = self._calculate_next_occurrence(
                reminder_data.due_date,
                reminder_data.recurrence_type,
                reminder_data.recurrence_interval,
                reminder_data.recurrence_days_of_week,
                reminder_data.recurrence_day_of_month
            )
        
        reminder = Reminder(
            id=reminder_id,
            title=reminder_data.title,
            description=reminder_data.description,
            due_date=reminder_data.due_date,
            status=reminder_data.status,
            priority=reminder_data.priority,
            tags=reminder_data.tags,
            recurrence_type=reminder_data.recurrence_type,
            recurrence_interval=reminder_data.recurrence_interval,
            recurrence_end_date=reminder_data.recurrence_end_date,
            recurrence_count=reminder_data.recurrence_count,
            recurrence_days_of_week=reminder_data.recurrence_days_of_week,
            recurrence_day_of_month=reminder_data.recurrence_day_of_month,
            is_recurring=is_recurring,
            next_occurrence=next_occurrence,
            created_at=now,
            updated_at=now,
            created_by="default_user"
        )
        
        reminder_dict = self._reminder_to_dict(reminder)
        await self.collection.insert_one(reminder_dict)
        
        return reminder

    async def get_by_id(self, reminder_id: str) -> Optional[Reminder]:
        """
        Get reminder by ID
        
        Args:
            reminder_id: Reminder identifier
            
        Returns:
            Reminder if found, None otherwise
        """
        doc = await self.collection.find_one({"id": reminder_id})
        return self._dict_to_reminder(doc) if doc else None

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[ReminderStatus] = None,
        priority: Optional[ReminderPriority] = None,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None,
        due_before: Optional[datetime] = None,
        due_after: Optional[datetime] = None,
        overdue_only: bool = False,
        pending_only: bool = False
    ) -> Dict[str, Any]:
        """
        List reminders with pagination and filters
        
        Args:
            page: Page number (1-based)
            page_size: Items per page
            status: Filter by status
            priority: Filter by priority
            tags: Filter by tags (any match)
            search: Search in title and description
            due_before: Filter reminders due before this date
            due_after: Filter reminders due after this date
            overdue_only: Show only overdue reminders
            pending_only: Show only pending reminders
            
        Returns:
            Dictionary with reminders, total count, and pagination info
        """
        # Build query
        query = {}
        
        if status:
            query["status"] = status
        
        if priority:
            query["priority"] = priority
        
        if tags:
            query["tags"] = {"$in": tags}
        
        if search:
            query["$text"] = {"$search": search}
        
        # Date filters
        date_query = {}
        if due_before:
            date_query["$lte"] = due_before.isoformat()
        if due_after:
            date_query["$gte"] = due_after.isoformat()
        if date_query:
            query["due_date"] = date_query
        
        if overdue_only:
            now = datetime.utcnow()
            query["due_date"] = {"$lt": now.isoformat()}
            query["status"] = {"$nin": [ReminderStatus.COMPLETED, ReminderStatus.CANCELLED]}
        
        if pending_only:
            query["status"] = ReminderStatus.PENDING
        
        # Calculate pagination
        skip = (page - 1) * page_size
        
        # Get total count
        total = await self.collection.count_documents(query)
        
        # Get paginated results
        cursor = self.collection.find(query).sort("due_date", 1).skip(skip).limit(page_size)
        docs = await cursor.to_list(length=page_size)
        
        reminders = [self._dict_to_reminder(doc) for doc in docs]
        
        total_pages = (total + page_size - 1) // page_size
        
        return {
            "reminders": reminders,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }

    async def update(self, reminder_id: str, reminder_update: ReminderUpdate) -> Optional[Reminder]:
        """
        Update reminder
        
        Args:
            reminder_id: Reminder identifier
            reminder_update: Update data
            
        Returns:
            Updated reminder if found, None otherwise
        """
        # Get current reminder
        current_reminder = await self.get_by_id(reminder_id)
        if not current_reminder:
            return None
        
        # Prepare update data
        update_data = {}
        for field, value in reminder_update.model_dump(exclude_unset=True).items():
            if value is not None:
                if isinstance(value, datetime):
                    update_data[field] = value.isoformat()
                else:
                    update_data[field] = value
        
        # Always update the updated_at timestamp
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # If status changed to completed, set completed_at
        if reminder_update.status == ReminderStatus.COMPLETED:
            update_data["completed_at"] = datetime.utcnow().isoformat()
        
        # Recalculate next occurrence if recurrence settings changed
        if any(field.startswith("recurrence_") for field in update_data.keys()) or "due_date" in update_data:
            merged_reminder = current_reminder.model_copy()
            for field, value in reminder_update.model_dump(exclude_unset=True).items():
                if value is not None:
                    setattr(merged_reminder, field, value)
            
            if merged_reminder.recurrence_type != RecurrenceType.NONE:
                next_occurrence = self._calculate_next_occurrence(
                    merged_reminder.due_date,
                    merged_reminder.recurrence_type,
                    merged_reminder.recurrence_interval,
                    merged_reminder.recurrence_days_of_week,
                    merged_reminder.recurrence_day_of_month
                )
                update_data["next_occurrence"] = next_occurrence.isoformat() if next_occurrence else None
                update_data["is_recurring"] = True
            else:
                update_data["is_recurring"] = False
                update_data["next_occurrence"] = None
        
        # Perform update
        await self.collection.update_one(
            {"id": reminder_id},
            {"$set": update_data}
        )
        
        # Return updated reminder
        return await self.get_by_id(reminder_id)

    async def update_status(self, reminder_id: str, status: ReminderStatus) -> bool:
        """
        Quick status update
        
        Args:
            reminder_id: Reminder identifier
            status: New status
            
        Returns:
            True if updated, False if not found
        """
        update_data = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if status == ReminderStatus.COMPLETED:
            update_data["completed_at"] = datetime.utcnow().isoformat()
        
        result = await self.collection.update_one(
            {"id": reminder_id},
            {"$set": update_data}
        )
        
        return result.modified_count > 0

    async def snooze(self, reminder_id: str, snooze_until: datetime) -> bool:
        """
        Snooze a reminder
        
        Args:
            reminder_id: Reminder identifier
            snooze_until: When reminder should reappear
            
        Returns:
            True if snoozed, False if not found
        """
        result = await self.collection.update_one(
            {"id": reminder_id},
            {"$set": {
                "status": ReminderStatus.SNOOZED,
                "snooze_until": snooze_until.isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        
        return result.modified_count > 0

    async def delete(self, reminder_id: str) -> bool:
        """
        Delete reminder
        
        Args:
            reminder_id: Reminder identifier
            
        Returns:
            True if deleted, False if not found
        """
        result = await self.collection.delete_one({"id": reminder_id})
        return result.deleted_count > 0

    async def bulk_delete(self, reminder_ids: List[str]) -> int:
        """
        Bulk delete reminders
        
        Args:
            reminder_ids: List of reminder identifiers
            
        Returns:
            Number of reminders deleted
        """
        result = await self.collection.delete_many({"id": {"$in": reminder_ids}})
        return result.deleted_count

    async def get_all_tags(self) -> List[str]:
        """
        Get all unique tags across all reminders
        
        Returns:
            List of unique tags
        """
        tags = await self.collection.distinct("tags")
        # Filter out None values and empty strings, then sort
        valid_tags = [tag for tag in tags if tag]
        return sorted(valid_tags)

    async def get_pending_reminders(self, limit: int = 50) -> List[Reminder]:
        """
        Get pending reminders that should be shown/notified
        
        Args:
            limit: Maximum number of reminders to return
            
        Returns:
            List of pending reminders
        """
        now = datetime.utcnow()
        
        # Get reminders that are:
        # 1. Pending status
        # 2. Due date has passed OR snooze time has passed
        query = {
            "$or": [
                {
                    "status": ReminderStatus.PENDING,
                    "due_date": {"$lte": now.isoformat()}
                },
                {
                    "status": ReminderStatus.SNOOZED,
                    "snooze_until": {"$lte": now.isoformat()}
                }
            ]
        }
        
        cursor = self.collection.find(query).sort("due_date", 1).limit(limit)
        docs = await cursor.to_list(length=limit)
        
        return [self._dict_to_reminder(doc) for doc in docs]

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get reminder statistics
        
        Returns:
            Dictionary with reminder statistics
        """
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        week_end = today_start + timedelta(days=7)
        seven_days_ago = now - timedelta(days=7)
        
        # Get counts by status
        total = await self.collection.count_documents({})
        pending = await self.collection.count_documents({"status": ReminderStatus.PENDING})
        completed = await self.collection.count_documents({"status": ReminderStatus.COMPLETED})
        snoozed = await self.collection.count_documents({"status": ReminderStatus.SNOOZED})
        cancelled = await self.collection.count_documents({"status": ReminderStatus.CANCELLED})
        
        # Get overdue count
        overdue = await self.collection.count_documents({
            "status": {"$nin": [ReminderStatus.COMPLETED, ReminderStatus.CANCELLED]},
            "due_date": {"$lt": now.isoformat()}
        })
        
        # Get due today
        due_today = await self.collection.count_documents({
            "status": {"$nin": [ReminderStatus.COMPLETED, ReminderStatus.CANCELLED]},
            "due_date": {
                "$gte": today_start.isoformat(),
                "$lt": today_end.isoformat()
            }
        })
        
        # Get due this week
        due_this_week = await self.collection.count_documents({
            "status": {"$nin": [ReminderStatus.COMPLETED, ReminderStatus.CANCELLED]},
            "due_date": {
                "$gte": today_start.isoformat(),
                "$lt": week_end.isoformat()
            }
        })
        
        # Get counts by priority
        low = await self.collection.count_documents({"priority": ReminderPriority.LOW})
        medium = await self.collection.count_documents({"priority": ReminderPriority.MEDIUM})
        high = await self.collection.count_documents({"priority": ReminderPriority.HIGH})
        urgent = await self.collection.count_documents({"priority": ReminderPriority.URGENT})
        
        # Get recent completions (last 7 days)
        recent_completed = await self.collection.count_documents({
            "status": ReminderStatus.COMPLETED,
            "completed_at": {"$gte": seven_days_ago.isoformat()}
        })
        
        return {
            "total": total,
            "pending": pending,
            "completed": completed,
            "snoozed": snoozed,
            "cancelled": cancelled,
            "overdue": overdue,
            "due_today": due_today,
            "due_this_week": due_this_week,
            "by_priority": {
                "low": low,
                "medium": medium,
                "high": high,
                "urgent": urgent
            },
            "recent_completed": recent_completed
        }

    def _calculate_next_occurrence(
        self,
        current_date: datetime,
        recurrence_type: RecurrenceType,
        interval: int,
        days_of_week: List[int] = None,
        day_of_month: int = None
    ) -> Optional[datetime]:
        """
        Calculate next occurrence for recurring reminder
        
        Args:
            current_date: Current due date
            recurrence_type: Type of recurrence
            interval: Recurrence interval
            days_of_week: Days of week for weekly recurrence
            day_of_month: Day of month for monthly recurrence
            
        Returns:
            Next occurrence date or None
        """
        if recurrence_type == RecurrenceType.NONE:
            return None
        
        try:
            if recurrence_type == RecurrenceType.MINUTELY:
                return current_date + timedelta(minutes=interval)
            
            elif recurrence_type == RecurrenceType.HOURLY:
                return current_date + timedelta(hours=interval)
            
            elif recurrence_type == RecurrenceType.DAILY:
                return current_date + timedelta(days=interval)
            
            elif recurrence_type == RecurrenceType.WEEKLY:
                if not days_of_week:
                    # Default to same day of week
                    return current_date + timedelta(weeks=interval)
                else:
                    # Find next occurrence on specified days
                    next_date = current_date + timedelta(days=1)
                    while next_date.weekday() not in days_of_week:
                        next_date += timedelta(days=1)
                    return next_date
            
            elif recurrence_type == RecurrenceType.MONTHLY:
                if day_of_month:
                    # Use specific day of month
                    next_month = current_date.month + interval
                    next_year = current_date.year
                    while next_month > 12:
                        next_month -= 12
                        next_year += 1
                    
                    try:
                        return current_date.replace(
                            year=next_year,
                            month=next_month,
                            day=day_of_month
                        )
                    except ValueError:
                        # Handle cases like Feb 30 -> Feb 28
                        import calendar
                        last_day = calendar.monthrange(next_year, next_month)[1]
                        actual_day = min(day_of_month, last_day)
                        return current_date.replace(
                            year=next_year,
                            month=next_month,
                            day=actual_day
                        )
                else:
                    # Use same day of month as current
                    next_month = current_date.month + interval
                    next_year = current_date.year
                    while next_month > 12:
                        next_month -= 12
                        next_year += 1
                    
                    try:
                        return current_date.replace(year=next_year, month=next_month)
                    except ValueError:
                        import calendar
                        last_day = calendar.monthrange(next_year, next_month)[1]
                        actual_day = min(current_date.day, last_day)
                        return current_date.replace(
                            year=next_year,
                            month=next_month,
                            day=actual_day
                        )
        
        except Exception as e:
            print(f"Error calculating next occurrence: {e}")
            return None
        
        return None

    async def create_recurring_instance(self, parent_reminder: Reminder) -> Optional[Reminder]:
        """
        Create next instance of a recurring reminder
        
        Args:
            parent_reminder: Parent recurring reminder
            
        Returns:
            New reminder instance or None
        """
        if not parent_reminder.is_recurring or not parent_reminder.next_occurrence:
            return None
        
        # Check if we should stop creating instances
        if parent_reminder.recurrence_end_date and parent_reminder.next_occurrence > parent_reminder.recurrence_end_date:
            return None
        
        if parent_reminder.recurrence_count and parent_reminder.occurrence_count >= parent_reminder.recurrence_count:
            return None
        
        # Create new instance
        new_reminder_data = ReminderCreate(
            title=parent_reminder.title,
            description=parent_reminder.description,
            due_date=parent_reminder.next_occurrence,
            status=ReminderStatus.PENDING,
            priority=parent_reminder.priority,
            tags=parent_reminder.tags,
            recurrence_type=parent_reminder.recurrence_type,
            recurrence_interval=parent_reminder.recurrence_interval,
            recurrence_end_date=parent_reminder.recurrence_end_date,
            recurrence_count=parent_reminder.recurrence_count,
            recurrence_days_of_week=parent_reminder.recurrence_days_of_week,
            recurrence_day_of_month=parent_reminder.recurrence_day_of_month
        )
        
        new_reminder = await self.create(new_reminder_data)
        
        # Update parent with new occurrence count and next occurrence
        next_next_occurrence = self._calculate_next_occurrence(
            parent_reminder.next_occurrence,
            parent_reminder.recurrence_type,
            parent_reminder.recurrence_interval,
            parent_reminder.recurrence_days_of_week,
            parent_reminder.recurrence_day_of_month
        )
        
        await self.collection.update_one(
            {"id": parent_reminder.id},
            {"$set": {
                "occurrence_count": parent_reminder.occurrence_count + 1,
                "next_occurrence": next_next_occurrence.isoformat() if next_next_occurrence else None,
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        
        return new_reminder


# Global repository instance
reminder_repository = ReminderRepository()