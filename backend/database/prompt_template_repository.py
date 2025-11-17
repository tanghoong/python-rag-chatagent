"""
Prompt Template Repository

Manages CRUD operations for prompt templates in MongoDB.
Includes indexing, ranking, and usage tracking functionality.
"""

from datetime import datetime
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING
import hashlib

from models.prompt_template_models import (
    PromptTemplate,
    PromptTemplateCreate,
    PromptTemplateUpdate,
    PromptTemplateStats
)


class PromptTemplateRepository:
    """Repository for prompt template operations"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.prompt_templates

    async def initialize(self):
        """Create indexes for better query performance"""
        try:
            await self.collection.create_index("id", unique=True)
            await self.collection.create_index("user_id")
            await self.collection.create_index("category")
            await self.collection.create_index("is_system")
            await self.collection.create_index("is_custom")
            await self.collection.create_index("click_count")
            await self.collection.create_index("last_used_at")
            await self.collection.create_index("ranking_score")
            # Skip text index for now to avoid issues
            print("✅ Prompt template indexes created successfully")
        except Exception as e:
            print(f"⚠️ Index creation warning: {e}")

    def _generate_id(self, title: str, user_id: str) -> str:
        """Generate a unique template ID"""
        content = f"{title}_{user_id}_{datetime.utcnow().isoformat()}"
        hash_obj = hashlib.sha256(content.encode())
        return f"tpl_{hash_obj.hexdigest()[:12]}"

    def _calculate_ranking_score(self, template: dict) -> float:
        """
        Calculate ranking score for a template
        Formula: (click_count * 0.4) + (recency * 0.3) + (success_rate * 0.3)
        """
        click_count = template.get("click_count", 0)
        success_rate = template.get("success_rate", 0.0)
        last_used_at = template.get("last_used_at")

        # Normalize click count (assuming max 1000 clicks)
        click_score = min(click_count / 1000.0, 1.0) * 0.4

        # Calculate recency score (more recent = higher score)
        recency_score = 0.0
        if last_used_at:
            days_ago = (datetime.utcnow() - last_used_at).days
            # Decay over 30 days
            recency_score = max(0, (30 - days_ago) / 30.0) * 0.3

        # Success rate already between 0-1
        success_score = success_rate * 0.3

        return click_score + recency_score + success_score

    async def create(
        self,
        template_data: PromptTemplateCreate,
        user_id: str = "default_user"
    ) -> PromptTemplate:
        """Create a new prompt template"""
        template_id = self._generate_id(template_data.title, user_id)

        template_dict = template_data.model_dump()
        template_dict.update({
            "id": template_id,
            "user_id": user_id,
            "click_count": 0,
            "last_used_at": None,
            "success_rate": 0.0,
            "ranking_score": 0.0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        result = await self.collection.insert_one(template_dict)
        if result.inserted_id:
            # Remove MongoDB's _id field before returning
            template_dict.pop("_id", None)
            return PromptTemplate(**template_dict)
        else:
            raise Exception("Failed to create template")

    async def get_by_id(self, template_id: str, user_id: str = "default_user") -> Optional[PromptTemplate]:
        """Get a template by ID"""
        template = await self.collection.find_one({
            "id": template_id,
            "$or": [
                {"user_id": user_id},
                {"is_system": True}
            ]
        })

        if template:
            template.pop("_id", None)
            return PromptTemplate(**template)
        return None

    async def list(
        self,
        user_id: str = "default_user",
        category: Optional[str] = None,
        is_system: Optional[bool] = None,
        is_custom: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[PromptTemplate]:
        """List templates with optional filters"""
        query = {
            "$or": [
                {"user_id": user_id},
                {"is_system": True}
            ]
        }

        if category:
            query["category"] = category
        if is_system is not None:
            query["is_system"] = is_system
        if is_custom is not None:
            query["is_custom"] = is_custom

        cursor = self.collection.find(query).skip(skip).limit(limit)
        templates = await cursor.to_list(length=limit)

        # Remove MongoDB _id and return as PromptTemplate objects
        result = []
        for template in templates:
            template.pop("_id", None)
            result.append(PromptTemplate(**template))

        return result

    async def get_popular(
        self,
        user_id: str = "default_user",
        limit: int = 6
    ) -> List[PromptTemplate]:
        """Get most popular templates sorted by ranking score"""
        query = {
            "$or": [
                {"user_id": user_id},
                {"is_system": True}
            ]
        }

        cursor = self.collection.find(query)
        templates = await cursor.to_list(length=None)

        # Calculate ranking scores and sort
        templates_with_scores = []
        for template in templates:
            template.pop("_id", None)
            score = self._calculate_ranking_score(template)
            templates_with_scores.append((score, template))

        # Sort by score descending
        templates_with_scores.sort(key=lambda x: x[0], reverse=True)

        # Return top N templates
        return [PromptTemplate(**t[1]) for t in templates_with_scores[:limit]]

    async def get_recent(
        self,
        user_id: str = "default_user",
        limit: int = 5
    ) -> List[PromptTemplate]:
        """Get recently used templates"""
        query = {
            "$or": [
                {"user_id": user_id},
                {"is_system": True}
            ],
            "last_used_at": {"$ne": None}
        }

        cursor = self.collection.find(query).sort("last_used_at", DESCENDING).limit(limit)
        templates = await cursor.to_list(length=limit)

        result = []
        for template in templates:
            template.pop("_id", None)
            result.append(PromptTemplate(**template))

        return result

    async def update(
        self,
        template_id: str,
        template_data: PromptTemplateUpdate,
        user_id: str = "default_user"
    ) -> Optional[PromptTemplate]:
        """Update a template (only custom templates)"""
        update_dict = {
            k: v for k, v in template_data.model_dump(exclude_unset=True).items()
            if v is not None
        }

        if not update_dict:
            return await self.get_by_id(template_id, user_id)

        update_dict["updated_at"] = datetime.utcnow()

        result = await self.collection.find_one_and_update(
            {
                "id": template_id,
                "user_id": user_id,
                "is_custom": True  # Only allow updating custom templates
            },
            {"$set": update_dict},
            return_document=True
        )

        if result:
            result.pop("_id", None)
            return PromptTemplate(**result)
        return None

    async def delete(self, template_id: str, user_id: str = "default_user") -> bool:
        """Delete a template (only custom templates)"""
        result = await self.collection.delete_one({
            "id": template_id,
            "user_id": user_id,
            "is_custom": True  # Only allow deleting custom templates
        })
        return result.deleted_count > 0

    async def track_usage(
        self,
        template_id: str,
        user_id: str = "default_user",
        success: bool = True
    ) -> Optional[PromptTemplate]:
        """Track template usage and update statistics"""
        template = await self.get_by_id(template_id, user_id)
        if not template:
            return None

        # Calculate new success rate
        total_uses = template.click_count + 1
        current_successes = template.success_rate * template.click_count
        new_successes = current_successes + (1 if success else 0)
        new_success_rate = new_successes / total_uses if total_uses > 0 else 0.0

        result = await self.collection.find_one_and_update(
            {"id": template_id},
            {
                "$inc": {"click_count": 1},
                "$set": {
                    "last_used_at": datetime.utcnow(),
                    "success_rate": new_success_rate,
                    "updated_at": datetime.utcnow()
                }
            },
            return_document=True
        )

        if result:
            result.pop("_id", None)
            return PromptTemplate(**result)
        return None

    async def get_categories(self, user_id: str = "default_user") -> List[str]:
        """Get all unique categories"""
        categories = await self.collection.distinct(
            "category",
            {
                "$or": [
                    {"user_id": user_id},
                    {"is_system": True}
                ]
            }
        )
        return sorted(categories)

    async def get_stats(self, user_id: str = "default_user") -> PromptTemplateStats:
        """Get template statistics"""
        query = {
            "$or": [
                {"user_id": user_id},
                {"is_system": True}
            ]
        }

        total = await self.collection.count_documents(query)
        system_count = await self.collection.count_documents({**query, "is_system": True})
        custom_count = await self.collection.count_documents({**query, "is_custom": True})

        # Get total clicks
        pipeline = [
            {"$match": query},
            {"$group": {"_id": None, "total_clicks": {"$sum": "$click_count"}}}
        ]
        click_result = await self.collection.aggregate(pipeline).to_list(length=1)
        total_clicks = click_result[0]["total_clicks"] if click_result else 0

        # Get category counts
        pipeline = [
            {"$match": query},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}}
        ]
        category_results = await self.collection.aggregate(pipeline).to_list(length=None)
        categories = {item["_id"]: item["count"] for item in category_results}

        # Get most popular
        popular = await self.get_popular(user_id, limit=1)
        most_popular = popular[0] if popular else None

        return PromptTemplateStats(
            total_templates=total,
            system_templates=system_count,
            custom_templates=custom_count,
            total_clicks=total_clicks,
            categories=categories,
            most_popular=most_popular
        )

    async def count(
        self,
        user_id: str = "default_user",
        category: Optional[str] = None
    ) -> int:
        """Count templates with optional filters"""
        query = {
            "$or": [
                {"user_id": user_id},
                {"is_system": True}
            ]
        }

        if category:
            query["category"] = category

        return await self.collection.count_documents(query)


# Note: Repository instances should be created in async contexts
# Use get_async_database() when creating PromptTemplateRepository instances
