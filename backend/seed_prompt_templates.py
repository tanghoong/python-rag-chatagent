"""
Seed script to populate system prompt templates.

Creates default templates across all categories to help users get started.
Run this once during initial setup or after database reset.

Usage:
    python seed_prompt_templates.py
"""

import asyncio
from database.connection import get_async_database
from database.prompt_template_repository import PromptTemplateRepository
from models.prompt_template_models import PromptTemplateCreate


# System prompt templates organized by category
SYSTEM_TEMPLATES = [
    # ==================== RAG / Document Search ====================
    {
        "title": "Summarize my documents",
        "prompt_text": "Summarize the key information from my uploaded documents",
        "category": "rag",
        "description": "Get a concise summary of your knowledge base",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Search documents for topic",
        "prompt_text": "Search my documents for information about: ",
        "category": "rag",
        "description": "Find specific information in your knowledge base",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Compare information across docs",
        "prompt_text": "Compare what my documents say about these topics: ",
        "category": "rag",
        "description": "Analyze differences between topics in your documents",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Find contradictions in documents",
        "prompt_text": "Are there any contradictions or inconsistencies in my uploaded documents?",
        "category": "rag",
        "description": "Identify conflicting information in knowledge base",
        "is_system": True,
        "is_custom": False,
    },

    # ==================== Task Management ====================
    {
        "title": "Create a new task",
        "prompt_text": "Create a task: ",
        "category": "tasks",
        "description": "Quickly add a task to your list",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Show my pending tasks",
        "prompt_text": "What tasks do I have pending?",
        "category": "tasks",
        "description": "View all incomplete tasks",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Show high priority tasks",
        "prompt_text": "Show me my high priority tasks",
        "category": "tasks",
        "description": "Focus on urgent items",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Mark task as complete",
        "prompt_text": "Mark this task as completed: ",
        "category": "tasks",
        "description": "Update task status to done",
        "is_system": True,
        "is_custom": False,
    },

    # ==================== Reminder System ====================
    {
        "title": "Set a reminder",
        "prompt_text": "Remind me to ",
        "category": "reminders",
        "description": "Create a one-time or recurring reminder",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "What are my reminders?",
        "prompt_text": "What reminders do I have coming up?",
        "category": "reminders",
        "description": "View all active reminders",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Daily recurring reminder",
        "prompt_text": "Remind me every day to ",
        "category": "reminders",
        "description": "Set up a daily habit reminder",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Weekly recurring reminder",
        "prompt_text": "Remind me every week to ",
        "category": "reminders",
        "description": "Set up a weekly recurring reminder",
        "is_system": True,
        "is_custom": False,
    },

    # ==================== Memory / Context ====================
    {
        "title": "What do you remember about me?",
        "prompt_text": "What do you remember about me and my preferences?",
        "category": "memory",
        "description": "Review stored personal context",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Search memories for topic",
        "prompt_text": "What do you remember about: ",
        "category": "memory",
        "description": "Find specific information in conversation history",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Review recent conversations",
        "prompt_text": "Summarize our recent conversations",
        "category": "memory",
        "description": "Get overview of recent chat history",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Remember this preference",
        "prompt_text": "Please remember that I prefer: ",
        "category": "memory",
        "description": "Store a personal preference for future reference",
        "is_system": True,
        "is_custom": False,
    },

    # ==================== Code / Development ====================
    {
        "title": "Help debug this code",
        "prompt_text": "Help me debug this code:\n```\n\n```",
        "category": "code",
        "description": "Get assistance fixing code issues",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Explain this concept",
        "prompt_text": "Explain this programming concept: ",
        "category": "code",
        "description": "Learn about programming topics",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Review my code",
        "prompt_text": "Review this code and suggest improvements:\n```\n\n```",
        "category": "code",
        "description": "Get code quality feedback",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Write a function to",
        "prompt_text": "Write a function that ",
        "category": "code",
        "description": "Generate code for specific functionality",
        "is_system": True,
        "is_custom": False,
    },

    # ==================== Research / Analysis ====================
    {
        "title": "Analyze this topic",
        "prompt_text": "Analyze the following topic and provide insights: ",
        "category": "research",
        "description": "Deep dive into a subject",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Compare A vs B",
        "prompt_text": "Compare and contrast: ",
        "category": "research",
        "description": "Analyze differences between options",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Pros and cons of",
        "prompt_text": "What are the pros and cons of: ",
        "category": "research",
        "description": "Evaluate advantages and disadvantages",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Explain like I'm 5",
        "prompt_text": "Explain this in simple terms: ",
        "category": "research",
        "description": "Break down complex topics simply",
        "is_system": True,
        "is_custom": False,
    },

    # ==================== Writing / Content ====================
    {
        "title": "Help me write",
        "prompt_text": "Help me write ",
        "category": "writing",
        "description": "Assistance with content creation",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Improve this text",
        "prompt_text": "Improve the following text:\n\n",
        "category": "writing",
        "description": "Get editing and enhancement suggestions",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Brainstorm ideas for",
        "prompt_text": "Brainstorm ideas for: ",
        "category": "writing",
        "description": "Generate creative concepts",
        "is_system": True,
        "is_custom": False,
    },
    {
        "title": "Summarize this content",
        "prompt_text": "Summarize the following:\n\n",
        "category": "writing",
        "description": "Create concise summaries",
        "is_system": True,
        "is_custom": False,
    },
]


async def seed_templates():
    """
    Populate database with system prompt templates.

    Will skip templates that already exist (based on title matching).
    """
    print("🌱 Starting prompt template seeding...")

    # Initialize repository
    db = get_async_database()
    repo = PromptTemplateRepository(db)
    await repo.initialize()

    created_count = 0
    skipped_count = 0

    for template_data in SYSTEM_TEMPLATES:
        try:
            # Check if template with this title already exists
            existing = await repo.collection.find_one({
                "title": template_data["title"],
                "is_system": True
            })

            if existing:
                print(f"⏭️  Skipping '{template_data['title']}' (already exists)")
                skipped_count += 1
                continue

            # Create template
            template_create = PromptTemplateCreate(**template_data)
            await repo.create(template_create)
            print(f"✅ Created: {template_data['title']} [{template_data['category']}]")
            created_count += 1

        except Exception as e:
            print(f"❌ Error creating '{template_data['title']}': {str(e)}")

    print("\n📊 Seeding complete!")
    print(f"   Created: {created_count} templates")
    print(f"   Skipped: {skipped_count} templates (already existed)")
    print(f"   Total: {len(SYSTEM_TEMPLATES)} templates processed")

    # Show category breakdown
    categories = {}
    for template in SYSTEM_TEMPLATES:
        cat = template["category"]
        categories[cat] = categories.get(cat, 0) + 1

    print("\n📂 Templates by category:")
    for cat, count in sorted(categories.items()):
        print(f"   {cat}: {count} templates")


if __name__ == "__main__":
    asyncio.run(seed_templates())
