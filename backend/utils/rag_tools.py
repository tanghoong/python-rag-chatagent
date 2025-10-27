"""
RAG Tools Module

Autonomous memory management tools for the AI agent.
Enables the agent to create vector databases, ingest documents, and manage memory.
"""

import os
from typing import List, Optional
from pathlib import Path
from contextvars import ContextVar
from langchain_core.tools import tool
from database.vector_store import VectorStoreManager, get_global_vector_store
from utils.document_processor import DocumentProcessor
from utils.retrieval_context import get_retrieval_context


# Context variable to store current chat_id for smart_search_memory
current_chat_id: ContextVar[Optional[str]] = ContextVar('current_chat_id', default=None)


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
def smart_search_memory(
    query: str,
    num_results: int = 5
) -> str:
    """
    AI Agent intelligently searches across BOTH global and chat-specific memory.

    This tool AUTOMATICALLY determines the best memory scope to use:
    - Searches BOTH global memory (shared knowledge) AND chat-specific memory
    - Returns the most relevant results from either or both sources
    - Indicates which memory source each result came from

    Use this tool instead of search_memory for better conversation quality.
    The AI will automatically get context from the right memory scope.

    Args:
        query: Search query for retrieving relevant context
        num_results: Total number of results to return (default: 5)

    Returns:
        Retrieved memories from both global and chat scopes with source indicators
    """
    all_results = []

    # Get chat_id from context variable
    chat_id = current_chat_id.get()

    # Get retrieval context to track chunks
    retrieval_ctx = get_retrieval_context()
    retrieval_ctx.add_search(query, "smart_memory")

    # Search global memory
    try:
        global_vs = VectorStoreManager(collection_name="global_memory")
        global_results = global_vs.search_with_score(query, k=num_results)
        for doc, score in global_results:
            all_results.append({
                "doc": doc,
                "score": score,
                "source": "🌐 Global Memory",
                "source_id": "global_memory"
            })
            # Track in retrieval context
            retrieval_ctx.add_chunk(
                content=doc.page_content,
                relevance_score=score,
                source="global_memory",
                metadata=doc.metadata,
                chunk_id=doc.metadata.get('chunk_id')
            )
    except Exception as e:
        print(f"Warning: Could not search global memory: {e}")

    # Search chat-specific memory if chat_id available
    if chat_id:
        try:
            chat_vs = VectorStoreManager(collection_name=f"chat_{chat_id}")
            chat_results = chat_vs.search_with_score(query, k=num_results)
            for doc, score in chat_results:
                all_results.append({
                    "doc": doc,
                    "score": score,
                    "source": "💬 Chat Memory",
                    "source_id": f"chat_{chat_id}"
                })
                # Track in retrieval context
                retrieval_ctx.add_chunk(
                    content=doc.page_content,
                    relevance_score=score,
                    source=f"chat_{chat_id}",
                    metadata=doc.metadata,
                    chunk_id=doc.metadata.get('chunk_id')
                )
        except Exception as e:
            print(f"Warning: Could not search chat memory: {e}")

    if not all_results:
        return f"No relevant memories found for: {query}"

    # Sort by relevance score (lower is better for distance metrics)
    all_results.sort(key=lambda x: x["score"])

    # Take top results
    top_results = all_results[:num_results]

    output = f"🧠 Smart Search: Found {len(top_results)} relevant memories:\n\n"

    for i, result in enumerate(top_results, 1):
        doc = result["doc"]
        score = result["score"]
        source = result["source"]

        output += f"{i}. {source} [Relevance: {score:.3f}]\n"
        output += f"   Content: {doc.page_content[:200]}...\n"

        if doc.metadata:
            output += f"   Metadata: {doc.metadata}\n"
        output += "\n"

    return output


@tool
def vector_search(
    query: str,
    collection_name: str = "global_memory",
    strategy: str = "hybrid",
    num_results: int = 5,
    diversity: float = 0.5
) -> str:
    """
    Advanced RAG retrieval tool with multiple search strategies.

    This tool provides sophisticated document retrieval with:
    - Multiple search strategies (semantic, keyword, hybrid, mmr)
    - Relevance scoring and re-ranking
    - Diversity control via MMR
    - Context window optimization

    Search Strategies:
    - "semantic": Pure vector similarity search (best for conceptual matches)
    - "keyword": Term-based search (best for exact term matches)
    - "hybrid": Combines semantic + keyword (balanced, recommended)
    - "mmr": Maximal Marginal Relevance (diverse, non-redundant results)

    Args:
        query: Search query for document retrieval
        collection_name: Target collection (default: "global_memory")
        strategy: Search strategy - "semantic", "keyword", "hybrid", or "mmr"
        num_results: Number of results to return (default: 5)
        diversity: For MMR strategy, controls diversity (0=max diversity, 1=max relevance)

    Returns:
        Retrieved documents with relevance scores and metadata
    """
    try:
        vs = VectorStoreManager(collection_name=collection_name)

        # Get retrieval context to track chunks
        retrieval_ctx = get_retrieval_context()
        retrieval_ctx.add_search(query, strategy)

        # Execute search based on strategy
        results, strategy_name = _execute_search_strategy(
            vs, query, strategy, num_results, diversity
        )

        if not results:
            return f"No relevant documents found for: {query}"

        # Build output with optimized context and track chunks
        output = _build_search_output(
            results,
            strategy,
            strategy_name,
            query,
            collection_name,
            retrieval_ctx
        )

        return output

    except Exception as e:
        return f"❌ Error in vector search: {str(e)}"


def _execute_search_strategy(vs, query, strategy, num_results, diversity):
    """Execute the appropriate search strategy"""
    if strategy == "semantic":
        results = vs.search_with_score(query, k=num_results)
        strategy_name = "🔍 Semantic Search"

    elif strategy == "keyword":
        results = vs._keyword_search(query, k=num_results)
        strategy_name = "📝 Keyword Search"

    elif strategy == "mmr":
        # MMR returns documents without scores
        docs = vs.mmr_search(
            query,
            k=num_results,
            fetch_k=num_results * 4,
            lambda_mult=diversity
        )
        results = [(doc, 0.0) for doc in docs]
        strategy_name = f"🎯 MMR Search (diversity={diversity})"

    else:  # hybrid (default)
        results = vs.hybrid_search(query, k=num_results)
        strategy_name = "⚡ Hybrid Search (semantic + keyword)"

    return results, strategy_name


def _build_search_output(results, strategy, strategy_name, query, collection_name, retrieval_ctx):
    """Build the search output and track chunks in retrieval context"""
    output = f"{strategy_name}\n"
    output += f"Query: {query}\n"
    output += f"Collection: {collection_name}\n"
    output += f"Found {len(results)} results:\n\n"

    total_chars = 0
    max_context_chars = 4000  # Context window optimization

    for i, (doc, score) in enumerate(results, 1):
        # Format score display
        if strategy == "mmr":
            score_display = "Diverse"
            actual_score = 0.0
        else:
            score_display = f"{score:.3f}"
            actual_score = score

        # Track in retrieval context
        retrieval_ctx.add_chunk(
            content=doc.page_content,
            relevance_score=actual_score,
            source=collection_name,
            metadata=doc.metadata,
            chunk_id=doc.metadata.get('chunk_id') if doc.metadata else None
        )

        output += f"{i}. [Relevance: {score_display}]\n"

        # Optimize content length for context window
        content = doc.page_content
        remaining_chars = max_context_chars - total_chars

        if remaining_chars < 100:
            output += "   ... (context limit reached)\n\n"
            break

        if len(content) > remaining_chars:
            content = content[:remaining_chars] + "..."

        output += f"   Content: {content}\n"
        total_chars += len(content)

        # Show metadata
        if doc.metadata:
            relevant_metadata = {
                k: v for k, v in doc.metadata.items()
                if k in ['source', 'filename', 'page', 'topic', 'author', 'date']
            }
            if relevant_metadata:
                output += f"   Metadata: {relevant_metadata}\n"
        output += "\n"

    # Add search statistics
    output += "📊 Statistics:\n"
    output += f"   Total results: {len(results)}\n"
    output += f"   Strategy: {strategy}\n"
    output += f"   Context chars used: {total_chars}/{max_context_chars}\n"

    return output


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
        smart_search_memory,
        vector_search,  # Advanced RAG retrieval tool
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
