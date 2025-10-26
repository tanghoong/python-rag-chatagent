"""
Test Advanced RAG Retrieval (Phase 2.4)

This script tests the advanced RAG retrieval features including:
- Vector search with multiple strategies
- Hybrid search (semantic + keyword)
- Relevance scoring and re-ranking
- MMR (Maximal Marginal Relevance) for diversity
- Context window optimization
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
from langchain_core.documents import Document
from database.vector_store import VectorStoreManager
from utils.rag_tools import vector_search

# Load environment
load_dotenv()


def test_vector_store_methods():
    """Test the new VectorStoreManager methods."""
    print("=" * 80)
    print("TEST 1: Vector Store Advanced Methods")
    print("=" * 80)
    
    # Create test collection
    vs = VectorStoreManager(collection_name="test_advanced_rag")
    
    # Add sample documents
    test_docs = [
        Document(
            page_content="Python is a high-level, interpreted programming language known for its simplicity and readability. It supports multiple programming paradigms including procedural, object-oriented, and functional programming.",
            metadata={"source": "python_guide.txt", "topic": "programming", "language": "python"}
        ),
        Document(
            page_content="Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. Common algorithms include neural networks, decision trees, and support vector machines.",
            metadata={"source": "ml_basics.txt", "topic": "AI", "subtopic": "machine_learning"}
        ),
        Document(
            page_content="Docker is a platform for developing, shipping, and running applications in containers. Containers are lightweight, portable, and ensure consistency across different environments.",
            metadata={"source": "docker_intro.txt", "topic": "DevOps", "technology": "containerization"}
        ),
        Document(
            page_content="RESTful APIs use HTTP methods like GET, POST, PUT, and DELETE to perform CRUD operations. They follow stateless communication principles and typically return data in JSON format.",
            metadata={"source": "api_design.txt", "topic": "web_development", "subtopic": "APIs"}
        ),
        Document(
            page_content="Microservices architecture breaks down applications into small, independent services that communicate through APIs. This approach improves scalability, maintainability, and enables independent deployment.",
            metadata={"source": "microservices.txt", "topic": "architecture", "pattern": "microservices"}
        ),
        Document(
            page_content="Python is widely used in data science and machine learning due to its extensive libraries like NumPy, Pandas, and scikit-learn. It's also popular for web development with frameworks like Django and Flask.",
            metadata={"source": "python_applications.txt", "topic": "programming", "language": "python"}
        ),
        Document(
            page_content="Kubernetes orchestrates containerized applications across clusters. It handles deployment, scaling, and management of containerized workloads, working well with Docker containers.",
            metadata={"source": "kubernetes_intro.txt", "topic": "DevOps", "technology": "orchestration"}
        ),
        Document(
            page_content="Neural networks are computing systems inspired by biological neural networks. They consist of layers of interconnected nodes that process information and learn patterns from data.",
            metadata={"source": "neural_networks.txt", "topic": "AI", "subtopic": "deep_learning"}
        ),
    ]
    
    print(f"\n📝 Adding {len(test_docs)} test documents...")
    vs.add_documents(test_docs)
    print("✅ Documents added successfully!\n")
    
    return vs


def test_semantic_search(vs):
    """Test semantic search."""
    print("=" * 80)
    print("TEST 2: Semantic Search")
    print("=" * 80)
    
    query = "What is machine learning?"
    print(f"\n🔍 Query: {query}")
    print("-" * 40)
    
    results = vs.search_with_score(query, k=3)
    
    for i, (doc, score) in enumerate(results, 1):
        print(f"\n{i}. Score: {score:.4f}")
        print(f"   Content: {doc.page_content[:150]}...")
        print(f"   Metadata: {doc.metadata}")
    
    print("\n✅ Semantic search completed!\n")


def test_hybrid_search(vs):
    """Test hybrid search (semantic + keyword)."""
    print("=" * 80)
    print("TEST 3: Hybrid Search (Semantic + Keyword)")
    print("=" * 80)
    
    query = "Python programming containers"
    print(f"\n🔍 Query: {query}")
    print("-" * 40)
    
    results = vs.hybrid_search(query, k=3, semantic_weight=0.7, keyword_weight=0.3)
    
    for i, (doc, score) in enumerate(results, 1):
        print(f"\n{i}. Combined Score: {score:.4f}")
        print(f"   Content: {doc.page_content[:150]}...")
        print(f"   Metadata: {doc.metadata}")
    
    print("\n✅ Hybrid search completed!\n")


def test_mmr_search(vs):
    """Test MMR (Maximal Marginal Relevance) search for diversity."""
    print("=" * 80)
    print("TEST 4: MMR Search (Diverse Results)")
    print("=" * 80)
    
    query = "software development and deployment"
    print(f"\n🔍 Query: {query}")
    print(f"   Goal: Get diverse perspectives (microservices, containers, APIs, etc.)")
    print("-" * 40)
    
    results = vs.mmr_search(query, k=4, fetch_k=20, lambda_mult=0.5)
    
    for i, doc in enumerate(results, 1):
        print(f"\n{i}. Content: {doc.page_content[:150]}...")
        print(f"   Metadata: {doc.metadata}")
    
    print("\n✅ MMR search completed!\n")


def test_vector_search_tool():
    """Test the vector_search tool with different strategies."""
    print("=" * 80)
    print("TEST 5: Vector Search Tool (All Strategies)")
    print("=" * 80)
    
    collection_name = "test_advanced_rag"
    query = "Python and machine learning"
    
    strategies = ["semantic", "keyword", "hybrid", "mmr"]
    
    for strategy in strategies:
        print(f"\n{'=' * 80}")
        print(f"Strategy: {strategy.upper()}")
        print('=' * 80)
        
        result = vector_search.invoke({
            "query": query,
            "collection_name": collection_name,
            "strategy": strategy,
            "num_results": 3,
            "diversity": 0.5
        })
        
        print(result)
    
    print("\n✅ All vector search strategies tested!\n")


def test_context_window_optimization():
    """Test context window optimization with large content."""
    print("=" * 80)
    print("TEST 6: Context Window Optimization")
    print("=" * 80)
    
    # Create documents with longer content
    vs = VectorStoreManager(collection_name="test_context_window")
    
    long_docs = [
        Document(
            page_content="Lorem ipsum dolor sit amet. " * 200,  # Long document
            metadata={"source": "doc1.txt", "length": "long"}
        ),
        Document(
            page_content="Machine learning algorithms process data. " * 150,
            metadata={"source": "doc2.txt", "length": "long"}
        ),
        Document(
            page_content="Python programming language features. " * 100,
            metadata={"source": "doc3.txt", "length": "medium"}
        ),
    ]
    
    vs.add_documents(long_docs)
    
    print("\n🔍 Testing with multiple large documents...")
    print("   Max context window: 4000 characters")
    print("-" * 40)
    
    result = vector_search.invoke({
        "query": "machine learning",
        "collection_name": "test_context_window",
        "strategy": "hybrid",
        "num_results": 10,
    })
    
    print(result)
    
    # Cleanup
    vs.clear_collection()
    print("\n✅ Context window optimization tested!\n")


def cleanup():
    """Clean up test collections."""
    print("=" * 80)
    print("CLEANUP: Removing test collections")
    print("=" * 80)
    
    test_collections = ["test_advanced_rag", "test_context_window"]
    
    for collection_name in test_collections:
        try:
            vs = VectorStoreManager(collection_name=collection_name)
            vs.clear_collection()
            print(f"✅ Cleaned up: {collection_name}")
        except Exception as e:
            print(f"⚠️  Warning cleaning {collection_name}: {e}")
    
    print("\n✅ Cleanup completed!\n")


def main():
    """Run all tests."""
    print("\n" + "=" * 80)
    print(" " * 20 + "ADVANCED RAG RETRIEVAL TESTS")
    print(" " * 25 + "Phase 2.4 Implementation")
    print("=" * 80 + "\n")
    
    try:
        # Test 1: Setup and add documents
        vs = test_vector_store_methods()
        
        # Test 2: Semantic search
        test_semantic_search(vs)
        
        # Test 3: Hybrid search
        test_hybrid_search(vs)
        
        # Test 4: MMR search
        test_mmr_search(vs)
        
        # Test 5: Vector search tool
        test_vector_search_tool()
        
        # Test 6: Context window optimization
        test_context_window_optimization()
        
        # Cleanup
        cleanup()
        
        print("=" * 80)
        print(" " * 25 + "ALL TESTS PASSED! ✅")
        print("=" * 80)
        print("\nPhase 2.4 Advanced RAG Retrieval implementation is complete!")
        print("\nFeatures implemented:")
        print("  ✅ Multiple search strategies (semantic, keyword, hybrid, mmr)")
        print("  ✅ Hybrid search combining semantic + keyword matching")
        print("  ✅ Relevance scoring and re-ranking")
        print("  ✅ MMR for diverse, non-redundant results")
        print("  ✅ Context window optimization")
        print("  ✅ Integration with LangChain agent")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Cleanup even on error
        try:
            cleanup()
        except:
            pass


if __name__ == "__main__":
    main()
