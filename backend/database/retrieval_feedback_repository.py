"""
Retrieval Feedback Repository

Manages user feedback on retrieved chunks to improve future retrievals.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from .connection import get_database


class RetrievalFeedbackRepository:
    """Repository for managing retrieval feedback"""

    def __init__(self, db: Optional[AsyncIOMotorDatabase] = None):
        """Initialize repository with database connection"""
        self.db = db or get_database()
        self.collection = self.db["retrieval_feedback"]
        self._ensure_indexes()

    def _ensure_indexes(self):
        """Ensure required indexes exist"""
        # Index for fast chunk_id lookup
        self.collection.create_index("chunk_id")
        # Index for querying by source
        self.collection.create_index("source")
        # Index for time-based queries
        self.collection.create_index("created_at")
        # Compound index for aggregations
        self.collection.create_index([("chunk_id", 1), ("helpful", 1)])

    async def record_feedback(
        self,
        chunk_id: str,
        helpful: bool,
        source: str,
        content: str,
        relevance_score: float,
        chat_id: Optional[str] = None,
        query: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Record user feedback on a retrieved chunk

        Args:
            chunk_id: Unique identifier for the chunk
            helpful: Whether the chunk was helpful (True) or not (False)
            source: Source document name
            content: The chunk content
            relevance_score: Original relevance score
            chat_id: Optional chat session ID
            query: Optional search query that retrieved this chunk
            metadata: Additional metadata

        Returns:
            Feedback ID
        """
        feedback_doc = {
            "chunk_id": chunk_id,
            "helpful": helpful,
            "source": source,
            "content": content,
            "relevance_score": relevance_score,
            "chat_id": chat_id,
            "query": query,
            "metadata": metadata or {},
            "created_at": datetime.utcnow(),
        }

        result = await self.collection.insert_one(feedback_doc)
        return str(result.inserted_id)

    async def get_chunk_feedback_stats(self, chunk_id: str) -> Dict[str, Any]:
        """
        Get feedback statistics for a specific chunk

        Args:
            chunk_id: Chunk identifier

        Returns:
            Dictionary with feedback stats
        """
        pipeline = [
            {"$match": {"chunk_id": chunk_id}},
            {
                "$group": {
                    "_id": "$chunk_id",
                    "total_feedback": {"$sum": 1},
                    "helpful_count": {
                        "$sum": {"$cond": [{"$eq": ["$helpful", True]}, 1, 0]}
                    },
                    "unhelpful_count": {
                        "$sum": {"$cond": [{"$eq": ["$helpful", False]}, 1, 0]}
                    },
                    "avg_relevance": {"$avg": "$relevance_score"},
                }
            },
        ]

        result = await self.collection.aggregate(pipeline).to_list(length=1)

        if result:
            stats = result[0]
            stats["helpfulness_ratio"] = (
                stats["helpful_count"] / stats["total_feedback"]
                if stats["total_feedback"] > 0
                else 0
            )
            return stats
        else:
            return {
                "total_feedback": 0,
                "helpful_count": 0,
                "unhelpful_count": 0,
                "helpfulness_ratio": 0,
                "avg_relevance": 0,
            }

    async def get_source_feedback_stats(self, source: str) -> Dict[str, Any]:
        """
        Get aggregate feedback stats for all chunks from a source

        Args:
            source: Source document name

        Returns:
            Feedback statistics for the source
        """
        pipeline = [
            {"$match": {"source": source}},
            {
                "$group": {
                    "_id": "$source",
                    "total_feedback": {"$sum": 1},
                    "helpful_count": {
                        "$sum": {"$cond": [{"$eq": ["$helpful", True]}, 1, 0]}
                    },
                    "unhelpful_count": {
                        "$sum": {"$cond": [{"$eq": ["$helpful", False]}, 1, 0]}
                    },
                    "avg_relevance": {"$avg": "$relevance_score"},
                    "unique_chunks": {"$addToSet": "$chunk_id"},
                }
            },
        ]

        result = await self.collection.aggregate(pipeline).to_list(length=1)

        if result:
            stats = result[0]
            stats["helpfulness_ratio"] = (
                stats["helpful_count"] / stats["total_feedback"]
                if stats["total_feedback"] > 0
                else 0
            )
            stats["unique_chunks_count"] = len(stats.get("unique_chunks", []))
            del stats["unique_chunks"]  # Remove large array from response
            return stats
        else:
            return {
                "total_feedback": 0,
                "helpful_count": 0,
                "unhelpful_count": 0,
                "helpfulness_ratio": 0,
                "avg_relevance": 0,
                "unique_chunks_count": 0,
            }

    async def get_poor_performing_chunks(
        self, min_feedback: int = 3, max_helpfulness: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Get chunks with poor feedback scores for potential improvement

        Args:
            min_feedback: Minimum feedback count to consider
            max_helpfulness: Maximum helpfulness ratio (default 0.3 = 30%)

        Returns:
            List of poor performing chunks
        """
        pipeline = [
            {
                "$group": {
                    "_id": "$chunk_id",
                    "source": {"$first": "$source"},
                    "content": {"$first": "$content"},
                    "total_feedback": {"$sum": 1},
                    "helpful_count": {
                        "$sum": {"$cond": [{"$eq": ["$helpful", True]}, 1, 0]}
                    },
                    "avg_relevance": {"$avg": "$relevance_score"},
                }
            },
            {
                "$addFields": {
                    "helpfulness_ratio": {
                        "$cond": [
                            {"$gt": ["$total_feedback", 0]},
                            {"$divide": ["$helpful_count", "$total_feedback"]},
                            0,
                        ]
                    }
                }
            },
            {
                "$match": {
                    "total_feedback": {"$gte": min_feedback},
                    "helpfulness_ratio": {"$lte": max_helpfulness},
                }
            },
            {"$sort": {"helpfulness_ratio": 1}},
            {"$limit": 50},
        ]

        results = await self.collection.aggregate(pipeline).to_list(length=50)
        return results

    async def get_recent_feedback(
        self, limit: int = 50, helpful_only: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get recent feedback entries

        Args:
            limit: Maximum number of entries to return
            helpful_only: If True, only return helpful feedback

        Returns:
            List of recent feedback entries
        """
        query = {"helpful": True} if helpful_only else {}
        cursor = (
            self.collection.find(query).sort("created_at", -1).limit(limit)
        )

        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)

        return results

    async def delete_chunk_feedback(self, chunk_id: str) -> int:
        """
        Delete all feedback for a specific chunk

        Args:
            chunk_id: Chunk identifier

        Returns:
            Number of deleted feedback entries
        """
        result = await self.collection.delete_many({"chunk_id": chunk_id})
        return result.deleted_count

    async def get_overall_stats(self) -> Dict[str, Any]:
        """
        Get overall feedback statistics

        Returns:
            Overall statistics
        """
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_feedback": {"$sum": 1},
                    "helpful_count": {
                        "$sum": {"$cond": [{"$eq": ["$helpful", True]}, 1, 0]}
                    },
                    "unhelpful_count": {
                        "$sum": {"$cond": [{"$eq": ["$helpful", False]}, 1, 0]}
                    },
                    "avg_relevance": {"$avg": "$relevance_score"},
                    "unique_chunks": {"$addToSet": "$chunk_id"},
                    "unique_sources": {"$addToSet": "$source"},
                }
            }
        ]

        result = await self.collection.aggregate(pipeline).to_list(length=1)

        if result:
            stats = result[0]
            stats["helpfulness_ratio"] = (
                stats["helpful_count"] / stats["total_feedback"]
                if stats["total_feedback"] > 0
                else 0
            )
            stats["unique_chunks_count"] = len(stats.get("unique_chunks", []))
            stats["unique_sources_count"] = len(stats.get("unique_sources", []))
            del stats["unique_chunks"]
            del stats["unique_sources"]
            del stats["_id"]
            return stats
        else:
            return {
                "total_feedback": 0,
                "helpful_count": 0,
                "unhelpful_count": 0,
                "helpfulness_ratio": 0,
                "avg_relevance": 0,
                "unique_chunks_count": 0,
                "unique_sources_count": 0,
            }
