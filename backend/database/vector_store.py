"""
Vector Store Module

Manages ChromaDB vector database for RAG functionality.
Provides autonomous initialization and memory management.
Includes embedding caching to avoid re-processing.
"""

import os
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional, Set
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
        self._document_hashes: Set[str] = set()  # Cache of document content hashes

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

    def _compute_document_hash(self, document: Document) -> str:
        """
        Compute a hash of the document content for caching.
        
        Args:
            document: Document to hash
            
        Returns:
            SHA256 hash of the document content
        """
        # Combine page_content and relevant metadata for hashing
        content = document.page_content
        source = document.metadata.get('source', '')
        page = document.metadata.get('page', '')
        
        hash_input = f"{content}|{source}|{page}"
        return hashlib.sha256(hash_input.encode()).hexdigest()

    def _is_document_cached(self, document: Document) -> bool:
        """
        Check if a document is already in the cache.
        
        Args:
            document: Document to check
            
        Returns:
            True if document is already embedded
        """
        doc_hash = self._compute_document_hash(document)
        return doc_hash in self._document_hashes

    def _load_existing_hashes(self):
        """
        Load hashes of existing documents from the vector store.
        This should be called after initialization to populate the cache.
        """
        try:
            if not self.vector_store:
                return
                
            # Get all documents from the collection
            collection = self.vector_store._collection
            results = collection.get()
            
            # Extract and hash all existing documents
            if results and results.get('documents'):
                for i, content in enumerate(results['documents']):
                    # Reconstruct document metadata
                    metadata = results.get('metadatas', [])[i] if i < len(results.get('metadatas', [])) else {}
                    
                    # Create a temporary document to compute hash
                    temp_doc = Document(
                        page_content=content,
                        metadata=metadata
                    )
                    
                    doc_hash = self._compute_document_hash(temp_doc)
                    self._document_hashes.add(doc_hash)
                    
            print(f"✅ Loaded {len(self._document_hashes)} document hashes into cache")
            
        except Exception as e:
            print(f"⚠️ Could not load existing document hashes: {str(e)}")

    def add_documents(
        self,
        documents: List[Document],
        auto_optimize: bool = True,
        skip_duplicates: bool = True
    ) -> List[str]:
        """
        Add documents to vector store with duplicate detection and caching.

        Args:
            documents: List of LangChain Document objects
            auto_optimize: Whether to auto-optimize after adding
            skip_duplicates: Whether to skip documents that are already embedded

        Returns:
            List of document IDs
        """
        try:
            if not documents:
                return []

            # Filter out duplicates if enabled
            if skip_duplicates:
                # Load existing hashes if not already loaded
                if not self._document_hashes:
                    self._load_existing_hashes()
                
                original_count = len(documents)
                unique_docs = []
                
                for doc in documents:
                    if not self._is_document_cached(doc):
                        unique_docs.append(doc)
                        # Add to cache immediately
                        doc_hash = self._compute_document_hash(doc)
                        self._document_hashes.add(doc_hash)
                    else:
                        print(f"⏭️  Skipping duplicate document: {doc.metadata.get('source', 'unknown')}")
                
                skipped_count = original_count - len(unique_docs)
                if skipped_count > 0:
                    print(f"✅ Skipped {skipped_count} duplicate documents (already embedded)")
                
                documents = unique_docs

            if not documents:
                print("ℹ️  No new documents to add (all duplicates)")
                return []

            # Add to vector store
            ids = self.vector_store.add_documents(documents)

            print(f"✅ Added {len(documents)} new documents to {self.collection_name}")

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

    def hybrid_search(
        self,
        query: str,
        k: int = 5,
        semantic_weight: float = 0.7,
        keyword_weight: float = 0.3
    ) -> List[tuple[Document, float]]:
        """
        Perform hybrid search combining semantic and keyword search.

        Args:
            query: Search query
            k: Number of results to return
            semantic_weight: Weight for semantic search (0-1)
            keyword_weight: Weight for keyword search (0-1)

        Returns:
            List of (Document, score) tuples with combined scores
        """
        try:
            # Normalize weights
            total_weight = semantic_weight + keyword_weight
            semantic_weight = semantic_weight / total_weight
            keyword_weight = keyword_weight / total_weight

            # Perform semantic search
            semantic_results = self.vector_store.similarity_search_with_score(query, k=k * 2)

            # Perform keyword search (simple BM25-like approach)
            keyword_results = self._keyword_search(query, k=k * 2)

            # Combine and re-rank results
            combined_scores = {}

            # Add semantic scores
            for doc, score in semantic_results:
                doc_id = self._get_doc_id(doc)
                # Normalize score (lower is better for distance, convert to similarity)
                similarity = 1 / (1 + score)
                combined_scores[doc_id] = {
                    'doc': doc,
                    'score': similarity * semantic_weight
                }

            # Add keyword scores
            for doc, score in keyword_results:
                doc_id = self._get_doc_id(doc)
                if doc_id in combined_scores:
                    combined_scores[doc_id]['score'] += score * keyword_weight
                else:
                    combined_scores[doc_id] = {
                        'doc': doc,
                        'score': score * keyword_weight
                    }

            # Sort by combined score (higher is better)
            sorted_results = sorted(
                combined_scores.values(),
                key=lambda x: x['score'],
                reverse=True
            )

            # Return top k results with inverted scores for consistency
            return [(item['doc'], 1 - item['score']) for item in sorted_results[:k]]

        except Exception as e:
            print(f"❌ Error in hybrid search: {str(e)}")
            return []

    def _keyword_search(self, query: str, k: int = 5) -> List[tuple[Document, float]]:
        """
        Simple keyword-based search using term matching.

        Args:
            query: Search query
            k: Number of results

        Returns:
            List of (Document, score) tuples
        """
        try:
            query_terms = set(query.lower().split())
            all_docs = self.get_all_documents(limit=1000)

            scored_docs = []
            for doc_data in all_docs:
                content = doc_data['content'].lower()

                # Calculate simple term frequency score
                score = 0.0
                for term in query_terms:
                    if term in content:
                        # Simple TF scoring
                        score += content.count(term) / len(content.split())

                if score > 0:
                    doc = Document(
                        page_content=doc_data['content'],
                        metadata=doc_data.get('metadata', {})
                    )
                    scored_docs.append((doc, score))

            # Sort by score (higher is better)
            scored_docs.sort(key=lambda x: x[1], reverse=True)

            return scored_docs[:k]

        except Exception as e:
            print(f"❌ Error in keyword search: {str(e)}")
            return []

    def mmr_search(
        self,
        query: str,
        k: int = 5,
        fetch_k: int = 20,
        lambda_mult: float = 0.5
    ) -> List[Document]:
        """
        Maximal Marginal Relevance (MMR) search for diverse results.

        Args:
            query: Search query
            k: Number of results to return
            fetch_k: Number of initial candidates to fetch
            lambda_mult: Diversity parameter (0=max diversity, 1=max relevance)

        Returns:
            List of diverse, relevant documents
        """
        try:
            results = self.vector_store.max_marginal_relevance_search(
                query,
                k=k,
                fetch_k=fetch_k,
                lambda_mult=lambda_mult
            )
            return results

        except Exception as e:
            print(f"❌ Error in MMR search: {str(e)}")
            return []

    def _get_doc_id(self, doc: Document) -> str:
        """
        Generate a unique ID for a document based on its content and metadata.

        Args:
            doc: Document object

        Returns:
            Unique identifier string
        """
        import hashlib
        content_hash = hashlib.md5(doc.page_content.encode()).hexdigest()
        return content_hash

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

    def get_all_documents(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all documents from the collection.

        Args:
            limit: Maximum number of documents to return

        Returns:
            List of documents with metadata and content
        """
        try:
            collection = self.vector_store._collection
            result = collection.get(
                limit=limit,
                include=["documents", "metadatas"]
            )

            documents = []
            if result and result.get("documents"):
                for i, doc in enumerate(result["documents"]):
                    metadata = result["metadatas"][i] if i < len(result.get("metadatas", [])) else {}
                    documents.append({
                        "content": doc,
                        "metadata": metadata,
                        "source": self.collection_name
                    })

            return documents

        except Exception as e:
            print(f"❌ Error getting all documents: {str(e)}")
            return []

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

    def get_document_by_id(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific document by its memory ID.

        Args:
            memory_id: Unique memory ID (either mem_<hash> or ChromaDB UUID)

        Returns:
            Document data dict with content and metadata, or None if not found
        """
        try:
            collection = self.vector_store._collection

            # Get all documents and search for matching memory_id
            # Note: ChromaDB's where clause doesn't work reliably for exact string matches
            # so we fetch all and filter manually
            results = collection.get(include=["documents", "metadatas", "embeddings"])

            if results and results['ids']:
                # Find the document with matching memory_id or ChromaDB ID
                for i, metadata in enumerate(results['metadatas']):
                    # Check if metadata has memory_id and it matches
                    if metadata.get('memory_id') == memory_id:
                        return {
                            "id": results['ids'][i],
                            "memory_id": memory_id,
                            "content": results['documents'][i],
                            "metadata": metadata,
                            "embedding": results['embeddings'][i] if 'embeddings' in results and i < len(
                                results['embeddings']) else None}
                    # Fallback: check if ChromaDB ID matches (for old documents without memory_id)
                    elif results['ids'][i] == memory_id:
                        return {
                            "id": results['ids'][i],
                            "memory_id": metadata.get(
                                'memory_id',
                                memory_id),
                            "content": results['documents'][i],
                            "metadata": metadata,
                            "embedding": results['embeddings'][i] if 'embeddings' in results and i < len(
                                results['embeddings']) else None}

            print(f"⚠️ Memory not found: {memory_id}")
            return None

        except Exception as e:
            print(f"❌ Error getting document by ID: {str(e)}")
            return None

    def update_document(
        self,
        memory_id: str,
        content: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Update an existing document's content and/or metadata.

        Args:
            memory_id: Unique memory ID
            content: New content (will re-embed if changed)
            metadata: New metadata to merge with existing

        Returns:
            Success status
        """
        try:
            # Get existing document
            existing = self.get_document_by_id(memory_id)
            if not existing:
                print(f"⚠️ Cannot update - memory not found: {memory_id}")
                return False

            collection = self.vector_store._collection

            # Prepare updates
            new_content = content if content is not None else existing['content']
            new_metadata = {**existing['metadata']}

            if metadata:
                new_metadata.update(metadata)

            # Update timestamp
            from datetime import datetime
            new_metadata['updated_at'] = datetime.now().isoformat()

            # Ensure memory_id is preserved (for old documents that might not have it)
            if 'memory_id' not in new_metadata:
                new_metadata['memory_id'] = memory_id

            # If content changed, we need to re-embed
            if content and content != existing['content']:
                # Delete old and add new with same memory_id
                print(f"🔄 Re-embedding document (content changed): {memory_id}")
                collection.delete(ids=[existing['id']])

                doc = Document(
                    page_content=new_content,
                    metadata=new_metadata
                )
                self.vector_store.add_documents([doc])
            else:
                # Just update metadata
                print(f"📝 Updating metadata only: {memory_id}")
                collection.update(
                    ids=[existing['id']],
                    metadatas=[new_metadata]
                )

            print(f"✅ Updated memory: {memory_id}")
            return True

        except Exception as e:
            print(f"❌ Error updating document {memory_id}: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def delete_document(self, memory_id: str) -> bool:
        """
        Delete a specific document by memory ID.

        Args:
            memory_id: Unique memory ID

        Returns:
            Success status
        """
        try:
            # Get document to find its ChromaDB ID
            existing = self.get_document_by_id(memory_id)
            if not existing:
                print(f"⚠️ Cannot delete - memory not found: {memory_id}")
                return False

            collection = self.vector_store._collection
            chroma_id = existing['id']
            print(f"🗑️ Deleting ChromaDB document with ID: {chroma_id}")
            collection.delete(ids=[chroma_id])

            print(f"✅ Deleted memory: {memory_id}")
            return True

        except Exception as e:
            print(f"❌ Error deleting document {memory_id}: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def bulk_delete_documents(self, memory_ids: List[str]) -> int:
        """
        Delete multiple documents by their memory IDs.

        Args:
            memory_ids: List of memory IDs to delete

        Returns:
            Number of documents deleted
        """
        try:
            deleted_count = 0
            collection = self.vector_store._collection

            chroma_ids = []
            print(f"🗑️ Attempting to delete {len(memory_ids)} memories")
            for memory_id in memory_ids:
                existing = self.get_document_by_id(memory_id)
                if existing:
                    chroma_ids.append(existing['id'])
                    deleted_count += 1
                else:
                    print(f"⚠️ Memory not found for deletion: {memory_id}")

            if chroma_ids:
                print(f"🗑️ Deleting {len(chroma_ids)} ChromaDB documents")
                collection.delete(ids=chroma_ids)

            print(f"✅ Bulk deleted {deleted_count} memories")
            return deleted_count

        except Exception as e:
            print(f"❌ Error in bulk delete: {str(e)}")
            import traceback
            traceback.print_exc()
            return 0

    def list_documents(
        self,
        limit: int = 50,
        offset: int = 0,
        where: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        List documents with pagination and optional filtering.

        Args:
            limit: Maximum number of results
            offset: Number of results to skip
            where: ChromaDB where filter

        Returns:
            List of document data dicts
        """
        try:
            collection = self.vector_store._collection

            # Get total count first for pagination
            if where:
                all_results = collection.get(where=where, include=["documents", "metadatas"])
            else:
                all_results = collection.get(include=["documents", "metadatas"])

            total = len(all_results['ids'])

            # Apply pagination
            start_idx = offset
            end_idx = min(offset + limit, total)

            results = []
            for i in range(start_idx, end_idx):
                results.append({
                    "id": all_results['ids'][i],
                    "memory_id": all_results['metadatas'][i].get('memory_id', all_results['ids'][i]),
                    "content": all_results['documents'][i],
                    "metadata": all_results['metadatas'][i]
                })

            return results

        except Exception as e:
            print(f"❌ Error listing documents: {str(e)}")
            return []

    def count_documents(self, where: Optional[Dict[str, Any]] = None) -> int:
        """
        Count documents with optional filtering.

        Args:
            where: ChromaDB where filter

        Returns:
            Number of documents matching criteria
        """
        try:
            collection = self.vector_store._collection

            if where:
                results = collection.get(where=where)
            else:
                results = collection.get()

            return len(results['ids'])

        except Exception as e:
            print(f"❌ Error counting documents: {str(e)}")
            return 0

    def get_all_tags(self) -> List[str]:
        """
        Get all unique tags from the collection.

        Returns:
            List of unique tags
        """
        try:
            collection = self.vector_store._collection
            results = collection.get(include=["metadatas"])

            tags = set()
            for metadata in results['metadatas']:
                if 'tags' in metadata:
                    # Tags are stored as comma-separated strings
                    if isinstance(metadata['tags'], str):
                        tag_list = [t.strip() for t in metadata['tags'].split(',') if t.strip()]
                        tags.update(tag_list)
                    elif isinstance(metadata['tags'], list):
                        # Legacy support for old list format
                        tags.update(metadata['tags'])

            return sorted(tags)

        except Exception as e:
            print(f"❌ Error getting tags: {str(e)}")
            return []

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
