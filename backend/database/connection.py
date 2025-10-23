"""
MongoDB Database Connection Module

Handles connection to MongoDB database for storing personal posts and chat sessions.
"""

import os
from typing import Optional
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/rag_chatbot")
DB_NAME = os.getenv("DB_NAME", "rag_chatbot")
POSTS_COLLECTION = os.getenv("POSTS_COLLECTION", "personal_posts")
CHATS_COLLECTION = os.getenv("CHATS_COLLECTION", "chat_sessions")

# Global MongoDB client
_client: Optional[MongoClient] = None
_database: Optional[Database] = None


def get_database() -> Database:
    """
    Get MongoDB database instance.
    Creates connection if not exists.
    
    Returns:
        Database: MongoDB database instance
    """
    global _client, _database
    
    if _database is None:
        _client = MongoClient(MONGODB_URI)
        _database = _client[DB_NAME]
        print(f"✅ Connected to MongoDB database: {DB_NAME}")
    
    return _database


def get_posts_collection() -> Collection:
    """
    Get personal posts collection.
    
    Returns:
        Collection: MongoDB collection for personal posts
    """
    db = get_database()
    return db[POSTS_COLLECTION]


def get_chats_collection() -> Collection:
    """
    Get chat sessions collection.
    
    Returns:
        Collection: MongoDB collection for chat sessions
    """
    db = get_database()
    return db[CHATS_COLLECTION]


def test_connection() -> bool:
    """
    Test MongoDB connection.
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        db = get_database()
        # Ping the database
        db.command('ping')
        print("✅ MongoDB connection test successful!")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection test failed: {str(e)}")
        return False


def close_connection():
    """
    Close MongoDB connection.
    """
    global _client, _database
    
    if _client:
        _client.close()
        _client = None
        _database = None
        print("✅ MongoDB connection closed")


# Test connection on module import (for debugging)
if __name__ == "__main__":
    print("Testing MongoDB connection...")
    test_connection()
    close_connection()
