"""
Task Repository Module

MongoDB repository for task CRUD operations.
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from models.task_models import Task, TaskCreate, TaskUpdate, TaskStatus, TaskPriority
import hashlib
import time
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/rag_chatbot")
DB_NAME = os.getenv("DB_NAME", "rag_chatbot")


class TaskRepository:
    """Repository for task management operations"""

    def __init__(self):
        """Initialize task repository"""
        self._client = None
        self._db = None
        self._collection = None

    def _get_collection(self) -> AsyncIOMotorCollection:
        """Get MongoDB collection, creating fresh connection if needed"""
        # Create a new client for this event loop
        if self._client is None:
            self._client = AsyncIOMotorClient(MONGODB_URI)
            self._db = self._client[DB_NAME]
            self._collection = self._db["tasks"]
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
            await self.collection.create_index("created_at")
            await self.collection.create_index("updated_at")
            await self.collection.create_index("tags")
            await self.collection.create_index([("title", "text"), ("description", "text")])
            print("✅ Task indexes created successfully")
        except Exception as e:
            print(f"⚠️ Index creation warning: {e}")

    def _generate_task_id(self, title: str) -> str:
        """Generate unique task ID"""
        timestamp = str(time.time())
        unique_string = f"{title}_{timestamp}"
        hash_object = hashlib.md5(unique_string.encode())
        return f"task_{hash_object.hexdigest()[:12]}"

    def _task_to_dict(self, task: Task) -> dict:
        """Convert Task model to dictionary for MongoDB"""
        task_dict = task.model_dump()
        # Convert datetime to string for MongoDB
        task_dict["created_at"] = task.created_at.isoformat() if isinstance(
            task.created_at, datetime) else task.created_at
        task_dict["updated_at"] = task.updated_at.isoformat() if isinstance(
            task.updated_at, datetime) else task.updated_at
        return task_dict

    def _dict_to_task(self, doc: dict) -> Task:
        """Convert MongoDB document to Task model"""
        if doc is None:
            return None

        # Remove MongoDB _id field
        doc.pop("_id", None)

        # Convert string dates back to datetime
        if isinstance(doc.get("created_at"), str):
            doc["created_at"] = datetime.fromisoformat(doc["created_at"])
        if isinstance(doc.get("updated_at"), str):
            doc["updated_at"] = datetime.fromisoformat(doc["updated_at"])

        return Task(**doc)

    async def create(self, task_data: TaskCreate) -> Task:
        """
        Create a new task

        Args:
            task_data: Task creation data

        Returns:
            Created task
        """
        task_id = self._generate_task_id(task_data.title)
        now = datetime.utcnow()

        task = Task(
            id=task_id,
            title=task_data.title,
            description=task_data.description,
            status=task_data.status,
            priority=task_data.priority,
            tags=task_data.tags,
            created_at=now,
            updated_at=now,
            user_id="default_user"
        )

        task_dict = self._task_to_dict(task)
        await self.collection.insert_one(task_dict)

        return task

    async def get_by_id(self, task_id: str) -> Optional[Task]:
        """
        Get task by ID

        Args:
            task_id: Task identifier

        Returns:
            Task if found, None otherwise
        """
        doc = await self.collection.find_one({"id": task_id})
        return self._dict_to_task(doc) if doc else None

    async def list(
        self,
        page: int = 1,
        page_size: int = 50,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None
    ) -> tuple[List[Task], int]:
        """
        List tasks with pagination and filters

        Args:
            page: Page number (1-indexed)
            page_size: Number of tasks per page
            status: Filter by status
            priority: Filter by priority
            tags: Filter by tags
            search: Text search in title/description

        Returns:
            Tuple of (tasks list, total count)
        """
        # Build filter query
        query = {}

        if status:
            query["status"] = status

        if priority:
            query["priority"] = priority

        if tags:
            query["tags"] = {"$all": tags}

        if search:
            query["$text"] = {"$search": search}

        # Get total count
        total = await self.collection.count_documents(query)

        # Calculate pagination
        skip = (page - 1) * page_size

        # Fetch tasks
        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(page_size)
        docs = await cursor.to_list(length=page_size)

        tasks = [self._dict_to_task(doc) for doc in docs]

        return tasks, total

    async def update(self, task_id: str, task_update: TaskUpdate) -> Optional[Task]:
        """
        Update task

        Args:
            task_id: Task identifier
            task_update: Update data

        Returns:
            Updated task if found, None otherwise
        """
        # Get current task
        current_task = await self.get_by_id(task_id)
        if not current_task:
            return None

        # Build update data (only include non-None fields)
        update_data = task_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()

        # Update in database
        await self.collection.update_one(
            {"id": task_id},
            {"$set": update_data}
        )

        # Return updated task
        return await self.get_by_id(task_id)

    async def update_status(self, task_id: str, status: TaskStatus) -> Optional[Task]:
        """
        Quick status update

        Args:
            task_id: Task identifier
            status: New status

        Returns:
            Updated task if found, None otherwise
        """
        await self.collection.update_one(
            {"id": task_id},
            {"$set": {"status": status, "updated_at": datetime.utcnow().isoformat()}}
        )
        return await self.get_by_id(task_id)

    async def delete(self, task_id: str) -> bool:
        """
        Delete task

        Args:
            task_id: Task identifier

        Returns:
            True if deleted, False if not found
        """
        result = await self.collection.delete_one({"id": task_id})
        return result.deleted_count > 0

    async def bulk_delete(self, task_ids: List[str]) -> int:
        """
        Bulk delete tasks

        Args:
            task_ids: List of task identifiers

        Returns:
            Number of tasks deleted
        """
        result = await self.collection.delete_many({"id": {"$in": task_ids}})
        return result.deleted_count

    async def get_all_tags(self) -> List[str]:
        """
        Get all unique tags across all tasks

        Returns:
            List of unique tags
        """
        tags = await self.collection.distinct("tags")
        # Filter out None values and empty strings, then sort
        valid_tags = [tag for tag in tags if tag]
        return sorted(valid_tags)

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get task statistics

        Returns:
            Dictionary with task statistics
        """
        # Get counts by status
        total = await self.collection.count_documents({})
        todo = await self.collection.count_documents({"status": TaskStatus.TODO})
        in_progress = await self.collection.count_documents({"status": TaskStatus.IN_PROGRESS})
        completed = await self.collection.count_documents({"status": TaskStatus.COMPLETED})
        cancelled = await self.collection.count_documents({"status": TaskStatus.CANCELLED})

        # Get counts by priority
        low = await self.collection.count_documents({"priority": TaskPriority.LOW})
        medium = await self.collection.count_documents({"priority": TaskPriority.MEDIUM})
        high = await self.collection.count_documents({"priority": TaskPriority.HIGH})
        urgent = await self.collection.count_documents({"priority": TaskPriority.URGENT})

        # Get recent completions (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_completed = await self.collection.count_documents({
            "status": TaskStatus.COMPLETED,
            "updated_at": {"$gte": seven_days_ago.isoformat()}
        })

        return {
            "total": total,
            "todo": todo,
            "in_progress": in_progress,
            "completed": completed,
            "cancelled": cancelled,
            "by_priority": {
                "low": low,
                "medium": medium,
                "high": high,
                "urgent": urgent
            },
            "recent_completed": recent_completed
        }


# Global repository instance
task_repository = TaskRepository()
