"""
Vector Store Module

Manages ChromaDB vector database for RAG functionality.
Provides autonomous initialization and memory management.
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()

# Configuration
VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", "./data/vectordb")
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "openai").lower()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


def get_embeddings() -> Embeddings:
    """
    Get configured embeddings model based on provider.

    Returns:
        Embeddings instance (OpenAI or Google)
    """
    if EMBEDDING_PROVIDER == "google":
        if not GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not found for embeddings")
        return GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=GOOGLE_API_KEY
        )
    else:  # Default to OpenAI
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not found for embeddings")
        return OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=OPENAI_API_KEY
        )


def get_chroma_client(persist_directory: str) -> chromadb.Client:
    """
    Get or create a ChromaDB client with proper settings.

    Args:
        persist_directory: Directory to persist the database

    Returns:
        ChromaDB client instance
    """
    # Create directory if it doesn't exist
    Path(persist_directory).mkdir(parents=True, exist_ok=True)

    # Create client with persistent storage
    client = chromadb.PersistentClient(
        path=persist_directory,
        settings=Settings(
            anonymized_telemetry=False,
            allow_reset=True
        )
    )

    return client


class VectorStoreManager:
    """
    Manages vector store operations with autonomous capabilities.
    """

    def __init__(self, collection_name: str = "default", persist_directory: Optional[str] = None):
        """
        Initialize vector store manager.

        Args:
            collection_name: Name of the collection (chat_id or 'global')
            persist_directory: Directory to persist the vector store
        """
        self.collection_name = collection_name
        self.persist_directory = persist_directory or VECTOR_DB_PATH
        self.embeddings = get_embeddings()
        self.vector_store = None
        self.client = None

        # Auto-initialize on creation
        self._initialize()

    def _initialize(self):
        """
        Auto-initialize the vector store.
        Creates directory if needed and loads/creates collection.
        """
        try:
            # Get ChromaDB client
            self.client = get_chroma_client(self.persist_directory)

            # Initialize or load vector store
            self.vector_store = Chroma(
                client=self.client,
                collection_name=self.collection_name,
                embedding_function=self.embeddings
            )

            print(f"✅ Vector store initialized: {self.collection_name}")

        except Exception as e:
            print(f"❌ Error initializing vector store: {str(e)}")
            raise

    def add_documents(
        self,
        documents: List[Document],
        auto_optimize: bool = True
    ) -> List[str]:
        """
        Add documents to vector store with optional auto-optimization.

        Args:
            documents: List of LangChain Document objects
            auto_optimize: Whether to auto-optimize after adding

        Returns:
            List of document IDs
        """
        try:
            if not documents:
                return []

            # Add to vector store
            ids = self.vector_store.add_documents(documents)

            print(f"✅ Added {len(documents)} documents to {self.collection_name}")

            # Auto-optimize if enabled
            if auto_optimize:
                self._auto_optimize()

            return ids

        except Exception as e:
            print(f"❌ Error adding documents: {str(e)}")
            raise

    def search(
        self,
        query: str,
        k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Search for similar documents using semantic search.

        Args:
            query: Search query
            k: Number of results to return
            filter_dict: Optional metadata filter

        Returns:
            List of similar documents
        """
        try:
            if filter_dict:
                results = self.vector_store.similarity_search(
                    query,
                    k=k,
                    filter=filter_dict
                )
            else:
                results = self.vector_store.similarity_search(query, k=k)

            return results

        except Exception as e:
            print(f"❌ Error searching documents: {str(e)}")
            return []

    def search_with_score(
        self,
        query: str,
        k: int = 5
    ) -> List[tuple[Document, float]]:
        """
        Search with relevance scores.

        Args:
            query: Search query
            k: Number of results

        Returns:
            List of (Document, score) tuples
        """
        try:
            results = self.vector_store.similarity_search_with_score(query, k=k)
            return results

        except Exception as e:
            print(f"❌ Error searching with scores: {str(e)}")
            return []

    def delete_documents(self, ids: List[str]) -> bool:
        """
        Delete documents by IDs.

        Args:
            ids: List of document IDs to delete

        Returns:
            Success status
        """
        try:
            self.vector_store.delete(ids=ids)
            print(f"✅ Deleted {len(ids)} documents from {self.collection_name}")
            return True

        except Exception as e:
            print(f"❌ Error deleting documents: {str(e)}")
            return False

    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the collection.

        Returns:
            Dictionary with collection stats
        """
        try:
            collection = self.vector_store._collection
            count = collection.count()

            return {
                "collection_name": self.collection_name,
                "document_count": count,
                "persist_directory": self.persist_directory,
                "embedding_provider": EMBEDDING_PROVIDER
            }

        except Exception as e:
            print(f"❌ Error getting stats: {str(e)}")
            return {
                "collection_name": self.collection_name,
                "error": str(e)
            }

    def _auto_optimize(self):
        """
        Auto-optimize the vector store.
        Implements intelligent memory management.
        """
        try:
            # For now, just log. In future: implement deduplication, pruning, etc.
            stats = self.get_collection_stats()
            print(f"📊 Collection stats: {stats['document_count']} documents")

            # Future: Implement smart pruning based on relevance, age, etc.

        except Exception as e:
            print(f"⚠️ Auto-optimize warning: {str(e)}")

    def clear_collection(self) -> bool:
        """
        Clear all documents from the collection.

        Returns:
            Success status
        """
        try:
            # Delete the collection from ChromaDB
            if self.client and self.collection_name:
                try:
                    self.client.delete_collection(name=self.collection_name)
                    print(f"✅ Deleted collection from ChromaDB: {self.collection_name}")
                except Exception as e:
                    print(f"⚠️ Collection may not exist: {str(e)}")

            # Reinitialize to create fresh collection
            self._initialize()

            print(f"✅ Cleared and reinitialized collection: {self.collection_name}")
            return True

        except Exception as e:
            print(f"❌ Error clearing collection: {str(e)}")
            return False


def get_global_vector_store() -> VectorStoreManager:
    """
    Get the global vector store (shared across all chats).

    Returns:
        VectorStoreManager instance for global memory
    """
    return VectorStoreManager(collection_name="global_memory")


def get_chat_vector_store(chat_id: str) -> VectorStoreManager:
    """
    Get a chat-specific vector store.

    Args:
        chat_id: Unique chat identifier

    Returns:
        VectorStoreManager instance for chat-specific memory
    """
    return VectorStoreManager(collection_name=f"chat_{chat_id}")


# For testing
if __name__ == "__main__":
    print("Testing Vector Store Manager...")

    # Test initialization
    vs = VectorStoreManager(collection_name="test_collection")

    # Test adding documents
    test_docs = [
        Document(
            page_content="Python is a high-level programming language.",
            metadata={"source": "test", "topic": "programming"}
        ),
        Document(
            page_content="Machine learning is a subset of artificial intelligence.",
            metadata={"source": "test", "topic": "AI"}
        )
    ]

    ids = vs.add_documents(test_docs)
    print(f"Added documents with IDs: {ids}")

    # Test search
    results = vs.search("What is Python?", k=1)
    print(f"\nSearch results: {results}")

    # Test stats
    stats = vs.get_collection_stats()
    print(f"\nCollection stats: {stats}")

    # Cleanup
    vs.clear_collection()
    print("\nTest completed!")
