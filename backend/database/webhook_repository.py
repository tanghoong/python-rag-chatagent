"""
Webhook Repository Module

MongoDB repository for webhook CRUD operations and logging.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from models.webhook_models import (
    Webhook, WebhookCreate, WebhookUpdate, WebhookStatus,
    WebhookLog, WebhookLogStatus, WebhookEvent
)
import hashlib
import time
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/rag_chatbot")
DB_NAME = os.getenv("DB_NAME", "rag_chatbot")


class WebhookRepository:
    """Repository for webhook management operations"""

    def __init__(self):
        """Initialize webhook repository"""
        self._client = None
        self._db = None
        self._webhooks_collection = None
        self._logs_collection = None

    def _get_collections(self) -> Tuple[AsyncIOMotorCollection, AsyncIOMotorCollection]:
        """Get MongoDB collections, creating fresh connection if needed"""
        if self._client is None:
            self._client = AsyncIOMotorClient(MONGODB_URI)
            self._db = self._client[DB_NAME]
            self._webhooks_collection = self._db["webhooks"]
            self._logs_collection = self._db["webhook_logs"]
        return self._webhooks_collection, self._logs_collection

    @property
    def webhooks_collection(self) -> AsyncIOMotorCollection:
        """Property to get webhooks collection"""
        collections = self._get_collections()
        return collections[0]

    @property
    def logs_collection(self) -> AsyncIOMotorCollection:
        """Property to get logs collection"""
        collections = self._get_collections()
        return collections[1]

    async def ensure_indexes(self):
        """Create indexes for better query performance"""
        try:
            # Webhook indexes
            await self.webhooks_collection.create_index("id", unique=True)
            await self.webhooks_collection.create_index("status")
            await self.webhooks_collection.create_index("events")
            await self.webhooks_collection.create_index("created_at")
            await self.webhooks_collection.create_index("tags")
            await self.webhooks_collection.create_index([("name", "text"), ("description", "text")])
            
            # Log indexes
            await self.logs_collection.create_index("id", unique=True)
            await self.logs_collection.create_index("webhook_id")
            await self.logs_collection.create_index("event_type")
            await self.logs_collection.create_index("status")
            await self.logs_collection.create_index("triggered_at")
            
            print("✅ Webhook indexes created successfully")
        except Exception as e:
            print(f"⚠️ Index creation warning: {e}")

    def _generate_webhook_id(self, name: str) -> str:
        """Generate unique webhook ID"""
        timestamp = str(time.time())
        unique_string = f"{name}_{timestamp}"
        hash_object = hashlib.md5(unique_string.encode())
        return f"webhook_{hash_object.hexdigest()[:12]}"

    def _generate_log_id(self, webhook_id: str) -> str:
        """Generate unique log ID"""
        timestamp = str(time.time())
        unique_string = f"{webhook_id}_{timestamp}"
        hash_object = hashlib.md5(unique_string.encode())
        return f"log_{hash_object.hexdigest()[:12]}"

    def _webhook_to_dict(self, webhook: Webhook) -> dict:
        """Convert Webhook model to dictionary for MongoDB"""
        webhook_dict = webhook.model_dump()
        # Convert datetime to string for MongoDB
        webhook_dict["created_at"] = webhook.created_at.isoformat() if isinstance(
            webhook.created_at, datetime) else webhook.created_at
        webhook_dict["updated_at"] = webhook.updated_at.isoformat() if isinstance(
            webhook.updated_at, datetime) else webhook.updated_at
        if webhook.last_triggered_at:
            webhook_dict["last_triggered_at"] = webhook.last_triggered_at.isoformat() if isinstance(
                webhook.last_triggered_at, datetime) else webhook.last_triggered_at
        if webhook.last_success_at:
            webhook_dict["last_success_at"] = webhook.last_success_at.isoformat() if isinstance(
                webhook.last_success_at, datetime) else webhook.last_success_at
        return webhook_dict

    def _dict_to_webhook(self, doc: dict) -> Optional[Webhook]:
        """Convert MongoDB document to Webhook model"""
        if doc is None:
            return None

        # Remove MongoDB _id field
        doc.pop("_id", None)

        # Convert string dates back to datetime
        if isinstance(doc.get("created_at"), str):
            doc["created_at"] = datetime.fromisoformat(doc["created_at"])
        if isinstance(doc.get("updated_at"), str):
            doc["updated_at"] = datetime.fromisoformat(doc["updated_at"])
        if doc.get("last_triggered_at") and isinstance(doc.get("last_triggered_at"), str):
            doc["last_triggered_at"] = datetime.fromisoformat(doc["last_triggered_at"])
        if doc.get("last_success_at") and isinstance(doc.get("last_success_at"), str):
            doc["last_success_at"] = datetime.fromisoformat(doc["last_success_at"])

        return Webhook(**doc)

    def _log_to_dict(self, log: WebhookLog) -> dict:
        """Convert WebhookLog model to dictionary for MongoDB"""
        log_dict = log.model_dump()
        # Convert datetime to string for MongoDB
        log_dict["triggered_at"] = log.triggered_at.isoformat() if isinstance(
            log.triggered_at, datetime) else log.triggered_at
        return log_dict

    def _dict_to_log(self, doc: dict) -> Optional[WebhookLog]:
        """Convert MongoDB document to WebhookLog model"""
        if doc is None:
            return None

        # Remove MongoDB _id field
        doc.pop("_id", None)

        # Convert string dates back to datetime
        if isinstance(doc.get("triggered_at"), str):
            doc["triggered_at"] = datetime.fromisoformat(doc["triggered_at"])

        return WebhookLog(**doc)

    async def create(self, webhook_data: WebhookCreate, user_id: str = "default_user") -> Webhook:
        """
        Create a new webhook

        Args:
            webhook_data: Webhook creation data
            user_id: User identifier

        Returns:
            Created Webhook object
        """
        # Generate unique ID
        webhook_id = self._generate_webhook_id(webhook_data.name)

        # Create webhook object
        webhook = Webhook(
            id=webhook_id,
            **webhook_data.model_dump(),
            user_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Insert into database
        webhook_dict = self._webhook_to_dict(webhook)
        await self.webhooks_collection.insert_one(webhook_dict)

        return webhook

    async def get(self, webhook_id: str) -> Optional[Webhook]:
        """
        Get a webhook by ID

        Args:
            webhook_id: Webhook identifier

        Returns:
            Webhook object or None if not found
        """
        doc = await self.webhooks_collection.find_one({"id": webhook_id})
        return self._dict_to_webhook(doc)

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[WebhookStatus] = None,
        event_type: Optional[WebhookEvent] = None,
        tags: Optional[List[str]] = None,
        user_id: str = "default_user"
    ) -> Tuple[List[Webhook], int]:
        """
        List webhooks with pagination and filters

        Args:
            page: Page number (1-indexed)
            page_size: Number of items per page
            status: Filter by status
            event_type: Filter by event type
            tags: Filter by tags
            user_id: User identifier

        Returns:
            Tuple of (list of webhooks, total count)
        """
        # Build filter query
        query = {"user_id": user_id}
        if status:
            query["status"] = status
        if event_type:
            query["events"] = event_type
        if tags:
            query["tags"] = {"$in": tags}

        # Get total count
        total = await self.webhooks_collection.count_documents(query)

        # Calculate skip value for pagination
        skip = (page - 1) * page_size

        # Get webhooks with pagination
        cursor = self.webhooks_collection.find(query).sort(
            "created_at", -1
        ).skip(skip).limit(page_size)

        docs = await cursor.to_list(length=page_size)
        webhooks = [self._dict_to_webhook(doc) for doc in docs]

        return webhooks, total

    async def update(self, webhook_id: str, webhook_data: WebhookUpdate) -> Optional[Webhook]:
        """
        Update a webhook

        Args:
            webhook_id: Webhook identifier
            webhook_data: Update data

        Returns:
            Updated Webhook object or None if not found
        """
        # Get existing webhook
        existing = await self.get(webhook_id)
        if not existing:
            return None

        # Prepare update data
        update_dict = webhook_data.model_dump(exclude_unset=True)
        if update_dict:
            update_dict["updated_at"] = datetime.utcnow().isoformat()

            # Update in database
            await self.webhooks_collection.update_one(
                {"id": webhook_id},
                {"$set": update_dict}
            )

        # Return updated webhook
        return await self.get(webhook_id)

    async def delete(self, webhook_id: str) -> bool:
        """
        Delete a webhook

        Args:
            webhook_id: Webhook identifier

        Returns:
            True if deleted, False if not found
        """
        result = await self.webhooks_collection.delete_one({"id": webhook_id})
        
        # Also delete associated logs
        if result.deleted_count > 0:
            await self.logs_collection.delete_many({"webhook_id": webhook_id})
        
        return result.deleted_count > 0

    async def bulk_delete(self, webhook_ids: List[str], user_id: str = "default_user") -> int:
        """
        Delete multiple webhooks

        Args:
            webhook_ids: List of webhook IDs to delete
            user_id: User identifier

        Returns:
            Number of webhooks deleted
        """
        result = await self.webhooks_collection.delete_many({
            "id": {"$in": webhook_ids},
            "user_id": user_id
        })
        
        # Also delete associated logs
        if result.deleted_count > 0:
            await self.logs_collection.delete_many({"webhook_id": {"$in": webhook_ids}})
        
        return result.deleted_count

    async def get_all_tags(self, user_id: str = "default_user") -> List[str]:
        """
        Get all unique tags used in webhooks

        Args:
            user_id: User identifier

        Returns:
            List of unique tags
        """
        tags = await self.webhooks_collection.distinct("tags", {"user_id": user_id})
        return sorted(tags)

    async def get_by_event(self, event_type: WebhookEvent, user_id: str = "default_user") -> List[Webhook]:
        """
        Get all active webhooks for a specific event type

        Args:
            event_type: Event type to filter by
            user_id: User identifier

        Returns:
            List of active webhooks that listen to this event
        """
        query = {
            "user_id": user_id,
            "status": WebhookStatus.ACTIVE,
            "events": event_type
        }
        
        cursor = self.webhooks_collection.find(query)
        docs = await cursor.to_list(length=None)
        webhooks = [self._dict_to_webhook(doc) for doc in docs]
        
        return webhooks

    async def increment_stats(
        self,
        webhook_id: str,
        success: bool,
        triggered_at: Optional[datetime] = None
    ):
        """
        Increment webhook statistics

        Args:
            webhook_id: Webhook identifier
            success: Whether the trigger was successful
            triggered_at: Trigger timestamp
        """
        if triggered_at is None:
            triggered_at = datetime.utcnow()
        
        update_data = {
            "$inc": {
                "total_triggers": 1,
                "success_count" if success else "failure_count": 1
            },
            "$set": {
                "last_triggered_at": triggered_at.isoformat()
            }
        }
        
        if success:
            update_data["$set"]["last_success_at"] = triggered_at.isoformat()
        
        await self.webhooks_collection.update_one(
            {"id": webhook_id},
            update_data
        )

    # Webhook Log Methods

    async def create_log(self, log_data: Dict[str, Any]) -> WebhookLog:
        """
        Create a webhook execution log

        Args:
            log_data: Log data

        Returns:
            Created WebhookLog object
        """
        # Generate unique ID
        log_id = self._generate_log_id(log_data.get("webhook_id", "unknown"))

        # Create log object
        log = WebhookLog(
            id=log_id,
            **log_data,
            triggered_at=datetime.utcnow()
        )

        # Insert into database
        log_dict = self._log_to_dict(log)
        await self.logs_collection.insert_one(log_dict)

        return log

    async def get_logs(
        self,
        webhook_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
        status: Optional[WebhookLogStatus] = None,
        event_type: Optional[WebhookEvent] = None
    ) -> Tuple[List[WebhookLog], int]:
        """
        Get webhook execution logs with pagination

        Args:
            webhook_id: Filter by webhook ID
            page: Page number (1-indexed)
            page_size: Number of items per page
            status: Filter by status
            event_type: Filter by event type

        Returns:
            Tuple of (list of logs, total count)
        """
        # Build filter query
        query = {}
        if webhook_id:
            query["webhook_id"] = webhook_id
        if status:
            query["status"] = status
        if event_type:
            query["event_type"] = event_type

        # Get total count
        total = await self.logs_collection.count_documents(query)

        # Calculate skip value for pagination
        skip = (page - 1) * page_size

        # Get logs with pagination
        cursor = self.logs_collection.find(query).sort(
            "triggered_at", -1
        ).skip(skip).limit(page_size)

        docs = await cursor.to_list(length=page_size)
        logs = [self._dict_to_log(doc) for doc in docs]

        return logs, total

    async def get_stats(self, user_id: str = "default_user") -> Dict[str, Any]:
        """
        Get webhook statistics

        Args:
            user_id: User identifier

        Returns:
            Statistics dictionary
        """
        # Count webhooks by status
        total_webhooks = await self.webhooks_collection.count_documents({"user_id": user_id})
        active_webhooks = await self.webhooks_collection.count_documents({
            "user_id": user_id,
            "status": WebhookStatus.ACTIVE
        })
        inactive_webhooks = total_webhooks - active_webhooks

        # Aggregate trigger statistics
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": None,
                "total_triggers": {"$sum": "$total_triggers"},
                "total_success": {"$sum": "$success_count"},
                "total_failures": {"$sum": "$failure_count"}
            }}
        ]
        
        result = await self.webhooks_collection.aggregate(pipeline).to_list(length=1)
        
        total_triggers = result[0]["total_triggers"] if result else 0
        total_success = result[0]["total_success"] if result else 0
        total_failures = result[0]["total_failures"] if result else 0
        
        success_rate = (total_success / total_triggers * 100) if total_triggers > 0 else 0.0

        return {
            "total_webhooks": total_webhooks,
            "active_webhooks": active_webhooks,
            "inactive_webhooks": inactive_webhooks,
            "total_triggers": total_triggers,
            "total_success": total_success,
            "total_failures": total_failures,
            "success_rate": round(success_rate, 2)
        }


# Global repository instance
webhook_repository = WebhookRepository()
