"""
Sample data script to populate MongoDB with test posts.

Run this after setting up MongoDB to add sample blog posts.
"""

from database.connection import get_posts_collection, test_connection


def seed_sample_posts():
    """
    Insert sample blog posts into MongoDB.
    """
    print("🌱 Seeding sample posts...")

    # Test connection first
    if not test_connection():
        print("❌ Cannot seed data - database connection failed")
        return False

    posts_collection = get_posts_collection()

    # Clear existing posts (optional)
    # Uncomment the next line to clear all posts before seeding
    # posts_collection.delete_many({})

    sample_posts = [{"title": "Introduction to Python Programming",
                     "content": """Python is a high-level, interpreted programming language known for its simplicity and readability.
            It's widely used in web development, data science, artificial intelligence, and automation.
            Python's syntax is clean and easy to learn, making it perfect for beginners while being powerful
            enough for experts. Key features include dynamic typing, automatic memory management, and a vast
            ecosystem of libraries and frameworks.""",
                     "author": "Tech Blogger",
                     "date": "2025-01-15",
                     "tags": ["python",
                                "programming",
                                "tutorial",
                                "beginner"]},
                    {"title": "Building Modern Web APIs with FastAPI",
                     "content": """FastAPI is a modern, fast web framework for building APIs with Python 3.7+.
            It's based on standard Python type hints and offers automatic API documentation, data validation,
            and high performance comparable to Node.js and Go. FastAPI is perfect for building RESTful APIs
            and microservices. It includes features like dependency injection, background tasks, and WebSocket
            support out of the box.""",
                     "author": "Tech Blogger",
                     "date": "2025-01-20",
                     "tags": ["fastapi",
                              "python",
                              "web development",
                              "api",
                              "rest"]},
                    {"title": "Understanding LangChain and AI Agents",
                     "content": """LangChain is a framework for developing applications powered by language models.
            It provides tools for creating AI agents that can reason, use tools, and maintain context across
            conversations. The ReAct pattern (Reasoning + Acting) allows agents to think through problems
            step by step while deciding when to use external tools. This makes LangChain ideal for building
            chatbots, question-answering systems, and RAG applications.""",
                     "author": "Tech Blogger",
                     "date": "2025-02-01",
                     "tags": ["langchain",
                              "ai",
                              "agents",
                              "llm",
                              "chatbot",
                              "rag"]},
                    {"title": "MongoDB Basics for Modern Applications",
                     "content": """MongoDB is a NoSQL document database that stores data in flexible, JSON-like documents.
            Unlike traditional relational databases, MongoDB allows for dynamic schemas, making it easy to
            evolve your data model over time. It's particularly well-suited for applications with large volumes
            of data, real-time analytics, and content management systems. MongoDB offers powerful querying,
            indexing, and aggregation capabilities.""",
                     "author": "Tech Blogger",
                     "date": "2025-02-05",
                     "tags": ["mongodb",
                              "database",
                              "nosql",
                              "data storage"]},
                    {"title": "Getting Started with React and TypeScript",
                     "content": """React is a popular JavaScript library for building user interfaces, and TypeScript
            adds static typing to catch errors early. Together, they provide a powerful combination for
            building modern web applications. TypeScript's type system helps prevent bugs, improves code
            documentation, and enables better IDE support with autocomplete and refactoring tools.
            React Router v7 brings modern routing capabilities to React applications.""",
                     "author": "Tech Blogger",
                     "date": "2025-02-10",
                     "tags": ["react",
                              "typescript",
                              "frontend",
                              "web development",
                              "javascript"]},
                    {"title": "Introduction to Retrieval-Augmented Generation (RAG)",
                     "content": """RAG combines the power of large language models with external knowledge retrieval.
            Instead of relying solely on the model's training data, RAG systems fetch relevant information
            from databases or documents before generating responses. This approach reduces hallucinations,
            keeps information up-to-date, and allows AI systems to access private or domain-specific knowledge.
            RAG is essential for building reliable AI applications.""",
                     "author": "Tech Blogger",
                     "date": "2025-02-15",
                     "tags": ["rag",
                              "ai",
                              "llm",
                              "retrieval",
                              "knowledge base"]}]

    try:
        # Insert posts
        result = posts_collection.insert_many(sample_posts)
        print(f"✅ Successfully inserted {len(result.inserted_ids)} sample posts!")
        print("\nInserted posts:")
        for i, post in enumerate(sample_posts, 1):
            print(f"  {i}. {post['title']}")

        # Show collection stats
        total_count = posts_collection.count_documents({})
        print(f"\n📊 Total posts in database: {total_count}")

        return True

    except Exception as e:
        print(f"❌ Error seeding posts: {str(e)}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("RAG Chatbot - Sample Data Seeder")
    print("=" * 60)
    print()

    seed_sample_posts()

    print()
    print("=" * 60)
    print("✅ Seeding complete!")
    print("You can now test the chatbot with queries like:")
    print("  - 'Show me my posts about Python'")
    print("  - 'Tell me about my FastAPI articles'")
    print("  - 'What have I written about AI?'")
    print("=" * 60)
