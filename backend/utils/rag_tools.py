"""
RAG Tools Module

Autonomous memory management tools for the AI agent.
Enables the agent to create vector databases, ingest documents, and manage memory.
"""

import os
from typing import List, Optional
from pathlib import Path
from langchain_core.tools import tool
from database.vector_store import VectorStoreManager, get_global_vector_store
from utils.document_processor import DocumentProcessor


@tool
def create_memory_database(
    collection_name: str,
    scope: str = "chat"
) -> str:
    """
    AI Agent can autonomously create a new vector database for memory storage.

    Use this tool when:
    - Starting a new conversation that needs its own memory
    - Creating a specialized knowledge base
    - Initializing a new topic or project memory

    Args:
        collection_name: Name for the memory collection (e.g., "python_project", "research_notes")
        scope: "chat" for chat-specific or "global" for shared memory

    Returns:
        Success message with collection info
    """
    try:
        if scope == "global":
            vs = get_global_vector_store()
            msg = f"Created global memory database: {collection_name}"
        else:
            vs = VectorStoreManager(collection_name=collection_name)
            msg = f"Created chat-specific memory database: {collection_name}"

        stats = vs.get_collection_stats()

        return f"✅ {msg}\nStats: {stats}"

    except Exception as e:
        return f"❌ Error creating memory database: {str(e)}"


@tool
def ingest_document(
    file_path: str,
    collection_name: str = "global_memory",
    auto_chunk: bool = True,
    metadata: Optional[str] = None
) -> str:
    """
    AI Agent can autonomously ingest documents into memory.

    Use this tool to:
    - Load and process documents (PDF, TXT, MD, DOCX, HTML)
    - Automatically chunk and embed content
    - Store in vector database for retrieval

    Supported formats: .pdf, .txt, .md, .docx, .html

    Args:
        file_path: Path to the document file
        collection_name: Target memory collection (default: "global_memory")
        auto_chunk: Automatically split into optimal chunks
        metadata: Optional JSON string with metadata (e.g., '{"topic": "ML", "author": "John"}')

    Returns:
        Ingestion status with chunk count
    """
    try:
        # Parse metadata if provided
        import json
        meta_dict = json.loads(metadata) if metadata else {}

        # Process document
        processor = DocumentProcessor(chunk_size=1000, chunk_overlap=200)

        if not processor.is_supported(file_path):
            return f"❌ Unsupported file type. Supported: {', '.join(processor.SUPPORTED_EXTENSIONS.keys())}"

        chunks = processor.process_file(file_path, additional_metadata=meta_dict)

        # Store in vector database
        vs = VectorStoreManager(collection_name=collection_name)
        vs.add_documents(chunks)

        stats = vs.get_collection_stats()

        return (
            f"✅ Successfully ingested: {Path(file_path).name}\n"
            f"📄 Created {len(chunks)} chunks\n"
            f"💾 Stored in: {collection_name}\n"
            f"📊 Total documents in collection: {stats['document_count']}"
        )

    except FileNotFoundError:
        return f"❌ File not found: {file_path}"
    except Exception as e:
        return f"❌ Error ingesting document: {str(e)}"


@tool
def ingest_directory(
    directory_path: str,
    collection_name: str = "global_memory",
    recursive: bool = True
) -> str:
    """
    AI Agent can autonomously ingest entire directories of documents.

    Use this tool to:
    - Batch process multiple documents
    - Ingest entire knowledge bases
    - Recursively process folder structures

    Args:
        directory_path: Path to directory containing documents
        collection_name: Target memory collection
        recursive: Process subdirectories (default: True)

    Returns:
        Batch ingestion status
    """
    try:
        if not os.path.exists(directory_path):
            return f"❌ Directory not found: {directory_path}"

        # Process directory
        processor = DocumentProcessor(chunk_size=1000, chunk_overlap=200)
        chunks = processor.process_directory(directory_path, recursive=recursive)

        if not chunks:
            return f"⚠️ No supported documents found in {directory_path}"

        # Store in vector database
        vs = VectorStoreManager(collection_name=collection_name)
        vs.add_documents(chunks)

        stats = vs.get_collection_stats()

        return (
            f"✅ Successfully ingested directory: {directory_path}\n"
            f"📄 Created {len(chunks)} chunks from multiple files\n"
            f"💾 Stored in: {collection_name}\n"
            f"📊 Total documents in collection: {stats['document_count']}"
        )

    except Exception as e:
        return f"❌ Error ingesting directory: {str(e)}"


@tool
def save_memory(
    content: str,
    collection_name: str = "global_memory",
    metadata: Optional[str] = None
) -> str:
    """
    AI Agent can autonomously save information to memory.

    Use this tool to:
    - Remember important facts or insights
    - Store conversation context
    - Save user preferences or information

    Args:
        content: Text content to remember
        collection_name: Memory collection to use
        metadata: Optional JSON string with metadata

    Returns:
        Success status
    """
    try:
        from langchain_core.documents import Document
        import json
        from datetime import datetime

        # Parse metadata
        meta_dict = json.loads(metadata) if metadata else {}
        meta_dict.update({
            'saved_at': datetime.now().isoformat(),
            'source': 'agent_memory'
        })

        # Create document
        doc = Document(page_content=content, metadata=meta_dict)

        # Store
        vs = VectorStoreManager(collection_name=collection_name)
        vs.add_documents([doc])

        stats = vs.get_collection_stats()

        return (
            f"✅ Saved to memory: {collection_name}\n"
            f"💾 Total memories: {stats['document_count']}"
        )

    except Exception as e:
        return f"❌ Error saving memory: {str(e)}"


@tool
def search_memory(
    query: str,
    collection_name: str = "global_memory",
    num_results: int = 5
) -> str:
    """
    AI Agent can autonomously search its memory.

    Use this tool to:
    - Retrieve relevant past information
    - Find context for current questions
    - Access stored knowledge

    Args:
        query: Search query
        collection_name: Memory collection to search
        num_results: Number of results to return (default: 5)

    Returns:
        Retrieved memories with relevance scores
    """
    try:
        vs = VectorStoreManager(collection_name=collection_name)
        results = vs.search_with_score(query, k=num_results)

        if not results:
            return f"No relevant memories found for: {query}"

        output = f"🔍 Found {len(results)} relevant memories:\n\n"

        for i, (doc, score) in enumerate(results, 1):
            output += f"{i}. [Relevance: {score:.3f}]\n"
            output += f"   Content: {doc.page_content[:200]}...\n"

            # Show metadata
            if doc.metadata:
                output += f"   Metadata: {doc.metadata}\n"
            output += "\n"

        return output

    except Exception as e:
        return f"❌ Error searching memory: {str(e)}"


@tool
def get_memory_stats(collection_name: str = "global_memory") -> str:
    """
    AI Agent can check memory database statistics.

    Use this tool to:
    - Monitor memory usage
    - Check collection status
    - Verify ingestion success

    Args:
        collection_name: Memory collection to check

    Returns:
        Collection statistics
    """
    try:
        vs = VectorStoreManager(collection_name=collection_name)
        stats = vs.get_collection_stats()

        return (
            f"📊 Memory Statistics for: {collection_name}\n"
            f"📄 Documents: {stats.get('document_count', 0)}\n"
            f"💾 Storage: {stats.get('persist_directory', 'N/A')}\n"
            f"🔧 Embeddings: {stats.get('embedding_provider', 'N/A')}"
        )

    except Exception as e:
        return f"❌ Error getting stats: {str(e)}"


@tool
def delete_memory(
    collection_name: str,
    confirm: bool = False
) -> str:
    """
    AI Agent can delete a memory collection.

    Use this tool to:
    - Clear old or irrelevant memory
    - Reset a knowledge base
    - Free up storage

    CAUTION: This permanently deletes all memories in the collection.

    Args:
        collection_name: Collection to delete
        confirm: Must be True to actually delete

    Returns:
        Deletion status
    """
    try:
        if not confirm:
            return (
                "⚠️ Deletion requires confirmation.\n"
                f"To delete '{collection_name}', call again with confirm=True"
            )

        vs = VectorStoreManager(collection_name=collection_name)
        success = vs.clear_collection()

        if success:
            return f"✅ Deleted memory collection: {collection_name}"
        else:
            return f"❌ Failed to delete: {collection_name}"

    except Exception as e:
        return f"❌ Error deleting memory: {str(e)}"


@tool
def optimize_memory(collection_name: str = "global_memory") -> str:
    """
    AI Agent can optimize memory storage.

    Use this tool to:
    - Clean up duplicate entries
    - Prune low-relevance memories
    - Optimize storage performance

    Args:
        collection_name: Collection to optimize

    Returns:
        Optimization status
    """
    try:
        vs = VectorStoreManager(collection_name=collection_name)

        # Get stats before
        before_stats = vs.get_collection_stats()
        before_count = before_stats.get('document_count', 0)

        # Run optimization
        vs._auto_optimize()

        # Get stats after
        after_stats = vs.get_collection_stats()
        after_count = after_stats.get('document_count', 0)

        return (
            f"✅ Memory optimization complete: {collection_name}\n"
            f"📊 Documents before: {before_count}\n"
            f"📊 Documents after: {after_count}\n"
            f"💡 Future: Will implement deduplication and pruning"
        )

    except Exception as e:
        return f"❌ Error optimizing memory: {str(e)}"


def get_rag_tools() -> List:
    """
    Get all RAG and memory management tools for the agent.

    Returns:
        List of autonomous memory tools
    """
    return [
        create_memory_database,
        ingest_document,
        ingest_directory,
        save_memory,
        search_memory,
        get_memory_stats,
        delete_memory,
        optimize_memory
    ]


# For testing
if __name__ == "__main__":
    print("Testing RAG Tools...")

    # Test creating database
    result = create_memory_database.invoke({"collection_name": "test_memory", "scope": "chat"})
    print(f"\n{result}")

    # Test saving memory
    result = save_memory.invoke({
        "content": "Python is a versatile programming language.",
        "collection_name": "test_memory",
        "metadata": '{"topic": "programming"}'
    })
    print(f"\n{result}")

    # Test searching
    result = search_memory.invoke({
        "query": "What is Python?",
        "collection_name": "test_memory"
    })
    print(f"\n{result}")

    # Test stats
    result = get_memory_stats.invoke({"collection_name": "test_memory"})
    print(f"\n{result}")

    print("\nTests completed!")
