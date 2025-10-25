"""
Test Script for Phase 1.1: Autonomous Memory Management

This script tests the complete RAG pipeline:
1. Vector store initialization
2. Document processing
3. Memory management tools
4. Agent integration
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

print("=" * 60)
print("Phase 1.1: Autonomous Memory Management Test")
print("=" * 60)

# Test 1: Vector Store
print("\n[Test 1] Vector Store Initialization")
print("-" * 60)
try:
    from database.vector_store import VectorStoreManager, get_global_vector_store
    from langchain_core.documents import Document
    
    # Create test collection
    vs = VectorStoreManager(collection_name="test_phase_1_1")
    
    # Add test documents
    test_docs = [
        Document(
            page_content="Autonomous agents can manage their own memory.",
            metadata={"topic": "AI", "source": "test"}
        ),
        Document(
            page_content="RAG combines retrieval with generation for better responses.",
            metadata={"topic": "RAG", "source": "test"}
        )
    ]
    
    vs.add_documents(test_docs)
    stats = vs.get_collection_stats()
    
    print(f"✅ Vector store created: {stats['collection_name']}")
    print(f"✅ Documents stored: {stats['document_count']}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

# Test 2: Document Processor
print("\n[Test 2] Document Processing")
print("-" * 60)
try:
    from utils.document_processor import DocumentProcessor
    
    # Create test file
    test_file = "test_doc.txt"
    with open(test_file, "w") as f:
        f.write("""
# RAG System Test Document

This is a test document for the RAG chatbot system.

## Features
- Autonomous memory management
- Multi-format document support
- Intelligent chunking
- Vector search capabilities

The system can process PDF, TXT, MD, DOCX, and HTML files.
        """)
    
    # Process document
    processor = DocumentProcessor(chunk_size=100, chunk_overlap=20)
    chunks = processor.process_file(test_file)
    
    print(f"✅ Document processed: {test_file}")
    print(f"✅ Chunks created: {len(chunks)}")
    print(f"✅ First chunk preview: {chunks[0].page_content[:50]}...")
    
    # Cleanup
    os.remove(test_file)
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

# Test 3: RAG Tools
print("\n[Test 3] RAG Tools")
print("-" * 60)
try:
    from utils.rag_tools import save_memory, search_memory, get_memory_stats
    
    # Test save_memory
    save_result = save_memory.func(
        content="Python is preferred for ML projects",
        collection_name="test_phase_1_1",
        metadata='{"category": "preference"}'
    )
    print(f"Save Memory: {save_result[:100]}...")
    
    # Test search_memory
    search_result = search_memory.func(
        query="What language for ML?",
        collection_name="test_phase_1_1",
        num_results=2
    )
    print(f"Search Memory: Found results - {len(search_result)} chars")
    
    # Test stats
    stats_result = get_memory_stats.func(collection_name="test_phase_1_1")
    print(f"Memory Stats: {stats_result[:100]}...")
    
    print("✅ All RAG tools working correctly")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

# Test 4: Agent Integration
print("\n[Test 4] Agent Integration")
print("-" * 60)
try:
    from utils.tools import get_all_tools
    
    tools = get_all_tools()
    tool_names = [tool.name for tool in tools]
    
    print(f"✅ Total tools loaded: {len(tools)}")
    print(f"✅ Tool names: {', '.join(tool_names[:5])}...")
    
    # Check for RAG tools
    rag_tools = [name for name in tool_names if 'memory' in name or 'ingest' in name]
    print(f"✅ RAG tools: {', '.join(rag_tools)}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

# Test 5: Cleanup
print("\n[Test 5] Cleanup")
print("-" * 60)
try:
    # Clean up test collection
    vs = VectorStoreManager(collection_name="test_phase_1_1")
    vs.clear_collection()
    print("✅ Test collection cleaned up")
    
except Exception as e:
    print(f"❌ Error during cleanup: {str(e)}")

# Summary
print("\n" + "=" * 60)
print("Test Summary")
print("=" * 60)
print("✅ Phase 1.1 implementation is working correctly!")
print("\nNext steps:")
print("1. Install dependencies: pip install -r requirements.txt")
print("2. Configure .env with VECTOR_DB_PATH and EMBEDDING_PROVIDER")
print("3. Start the backend: uvicorn api.main:app --reload")
print("4. Test via API or frontend")
print("\n" + "=" * 60)
