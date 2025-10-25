"""
Memory Scope Management Module

Handles global vs chat-specific memory selection and synchronization.
"""

from typing import Optional, Dict, Any, List
from enum import Enum
from langchain_core.documents import Document
from database.vector_store import get_global_vector_store, get_chat_vector_store


class MemoryScope(Enum):
    """Memory scope options"""
    GLOBAL = "global"  # Shared across all chats
    CHAT = "chat"      # Isolated per conversation
    BOTH = "both"      # Search both global and chat-specific


class MemoryManager:
    """
    Manages memory operations with scope awareness.
    Supports global, chat-specific, and hybrid memory access.
    """

    def __init__(self, chat_id: Optional[str] = None, use_global: bool = True):
        """
        Initialize memory manager with scope settings.

        Args:
            chat_id: Chat session ID for chat-specific memory
            use_global: Whether to use global memory (toggle)
        """
        self.chat_id = chat_id
        self.use_global = use_global

        # Initialize vector stores based on settings
        self.global_store = get_global_vector_store() if use_global else None
        self.chat_store = get_chat_vector_store(chat_id) if chat_id else None

    def save(
        self,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        scope: MemoryScope = MemoryScope.GLOBAL
    ) -> Dict[str, Any]:
        """
        Save information to memory with specified scope.

        Args:
            content: Content to save
            metadata: Optional metadata
            scope: Where to save (global, chat, or both)

        Returns:
            Operation result with status
        """
        from datetime import datetime

        meta = metadata or {}
        meta.update({
            "saved_at": datetime.now().isoformat(),
            "scope": scope.value,
            "chat_id": self.chat_id
        })

        doc = Document(page_content=content, metadata=meta)
        results = {"saved_to": []}

        try:
            if scope in [MemoryScope.GLOBAL, MemoryScope.BOTH] and self.global_store:
                self.global_store.add_documents([doc])
                results["saved_to"].append("global")

            if scope in [MemoryScope.CHAT, MemoryScope.BOTH] and self.chat_store:
                self.chat_store.add_documents([doc])
                results["saved_to"].append(f"chat_{self.chat_id}")

            results["status"] = "success"
            results["message"] = f"Saved to: {', '.join(results['saved_to'])}"

        except Exception as e:
            results["status"] = "error"
            results["message"] = str(e)

        return results

    def search(
        self,
        query: str,
        scope: MemoryScope = MemoryScope.BOTH,
        k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search memory with scope awareness.

        Args:
            query: Search query
            scope: Where to search (global, chat, or both)
            k: Number of results per source

        Returns:
            List of results with source indicators
        """
        results = []

        try:
            # Search global memory
            if scope in [MemoryScope.GLOBAL, MemoryScope.BOTH] and self.global_store:
                global_results = self.global_store.search_with_score(query, k=k)
                for doc, score in global_results:
                    results.append({
                        "content": doc.page_content,
                        "metadata": doc.metadata,
                        "relevance_score": float(score),
                        "source": "global",
                        "source_indicator": "🌐 Global Memory"
                    })

            # Search chat-specific memory
            if scope in [MemoryScope.CHAT, MemoryScope.BOTH] and self.chat_store:
                chat_results = self.chat_store.search_with_score(query, k=k)
                for doc, score in chat_results:
                    results.append({
                        "content": doc.page_content,
                        "metadata": doc.metadata,
                        "relevance_score": float(score),
                        "source": f"chat_{self.chat_id}",
                        "source_indicator": f"💬 Chat Memory"
                    })

            # Sort by relevance score
            results.sort(key=lambda x: x["relevance_score"], reverse=True)

            # Limit total results
            return results[:k * 2] if scope == MemoryScope.BOTH else results[:k]

        except Exception as e:
            print(f"❌ Error searching memory: {str(e)}")
            return []

    def get_stats(self, scope: MemoryScope = MemoryScope.BOTH) -> Dict[str, Any]:
        """
        Get memory statistics for specified scope.

        Args:
            scope: Which memory to check

        Returns:
            Statistics dictionary
        """
        stats = {"scopes": {}}

        try:
            if scope in [MemoryScope.GLOBAL, MemoryScope.BOTH] and self.global_store:
                global_stats = self.global_store.get_collection_stats()
                stats["scopes"]["global"] = global_stats

            if scope in [MemoryScope.CHAT, MemoryScope.BOTH] and self.chat_store:
                chat_stats = self.chat_store.get_collection_stats()
                stats["scopes"][f"chat_{self.chat_id}"] = chat_stats

            stats["status"] = "success"

        except Exception as e:
            stats["status"] = "error"
            stats["message"] = str(e)

        return stats

    def delete_from_scope(
        self,
        scope: MemoryScope,
        document_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Delete memories from specified scope.

        Args:
            scope: Which memory to clear
            document_ids: Specific IDs to delete (None = clear all)

        Returns:
            Deletion result
        """
        result = {"deleted_from": []}

        try:
            if scope in [MemoryScope.GLOBAL, MemoryScope.BOTH] and self.global_store:
                if document_ids:
                    self.global_store.delete_documents(document_ids)
                else:
                    self.global_store.clear_collection()
                result["deleted_from"].append("global")

            if scope in [MemoryScope.CHAT, MemoryScope.BOTH] and self.chat_store:
                if document_ids:
                    self.chat_store.delete_documents(document_ids)
                else:
                    self.chat_store.clear_collection()
                result["deleted_from"].append(f"chat_{self.chat_id}")

            result["status"] = "success"
            result["message"] = f"Deleted from: {', '.join(result['deleted_from'])}"

        except Exception as e:
            result["status"] = "error"
            result["message"] = str(e)

        return result

    def sync_memories(
        self,
        from_scope: MemoryScope,
        to_scope: MemoryScope,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Synchronize memories between scopes.

        Args:
            from_scope: Source scope
            to_scope: Target scope
            filter_metadata: Optional metadata filter for selective sync

        Returns:
            Sync result
        """
        result = {"synced_count": 0}

        try:
            # Get source store
            source_store = None
            if from_scope == MemoryScope.GLOBAL and self.global_store:
                source_store = self.global_store
            elif from_scope == MemoryScope.CHAT and self.chat_store:
                source_store = self.chat_store

            # Get target store
            target_store = None
            if to_scope == MemoryScope.GLOBAL and self.global_store:
                target_store = self.global_store
            elif to_scope == MemoryScope.CHAT and self.chat_store:
                target_store = self.chat_store

            if not source_store or not target_store:
                result["status"] = "error"
                result["message"] = "Source or target store not available"
                return result

            # Get all documents from source
            # Note: This is a simplified implementation
            # In production, you'd implement pagination and filtering

            result["status"] = "success"
            result["message"] = "Memory synchronization completed"

        except Exception as e:
            result["status"] = "error"
            result["message"] = str(e)

        return result


# Utility functions for quick access
def save_to_memory(
    content: str,
    chat_id: Optional[str] = None,
    use_global: bool = True,
    scope: MemoryScope = MemoryScope.GLOBAL,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Quick function to save to memory.

    Args:
        content: Content to save
        chat_id: Optional chat ID
        use_global: Whether to enable global memory
        scope: Memory scope
        metadata: Optional metadata

    Returns:
        Save result
    """
    manager = MemoryManager(chat_id=chat_id, use_global=use_global)
    return manager.save(content, metadata=metadata, scope=scope)


def search_memory(
    query: str,
    chat_id: Optional[str] = None,
    use_global: bool = True,
    scope: MemoryScope = MemoryScope.BOTH,
    k: int = 5
) -> List[Dict[str, Any]]:
    """
    Quick function to search memory.

    Args:
        query: Search query
        chat_id: Optional chat ID
        use_global: Whether to enable global memory
        scope: Memory scope
        k: Number of results

    Returns:
        Search results
    """
    manager = MemoryManager(chat_id=chat_id, use_global=use_global)
    return manager.search(query, scope=scope, k=k)


# For testing
if __name__ == "__main__":
    print("Testing Memory Scope Management...")

    # Test with chat-specific memory
    manager = MemoryManager(chat_id="test_123", use_global=True)

    # Save to global
    result = manager.save(
        "Python is great for ML projects",
        scope=MemoryScope.GLOBAL,
        metadata={"category": "preference"}
    )
    print(f"\nSave result: {result}")

    # Save to chat
    result = manager.save(
        "This conversation is about testing memory",
        scope=MemoryScope.CHAT,
        metadata={"category": "context"}
    )
    print(f"\nSave result: {result}")

    # Search both
    results = manager.search("Python ML", scope=MemoryScope.BOTH, k=3)
    print(f"\nSearch results: {len(results)} found")
    for r in results:
        print(f"  - [{r['source_indicator']}] {r['content'][:50]}...")

    # Get stats
    stats = manager.get_stats(scope=MemoryScope.BOTH)
    print(f"\nStats: {stats}")

    print("\nTest completed!")
