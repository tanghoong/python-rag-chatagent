"""
Clean existing templates and re-seed with descriptions.

This script will:
1. Delete all existing system templates
2. Re-create them with proper descriptions
"""

import asyncio
from database.connection import get_async_database
from database.prompt_template_repository import PromptTemplateRepository
from seed_prompt_templates import SYSTEM_TEMPLATES
from models.prompt_template_models import PromptTemplateCreate


async def clean_and_reseed():
    """Clean existing templates and re-seed with descriptions"""
    print("🧹 Cleaning existing system templates...")

    # Initialize repository
    db = get_async_database()
    repo = PromptTemplateRepository(db)
    await repo.initialize()

    # Delete all existing system templates
    result = await repo.collection.delete_many({"is_system": True})
    print(f"🗑️  Deleted {result.deleted_count} existing system templates")

    # Re-seed with descriptions
    print("\n🌱 Re-seeding templates with descriptions...")
    created_count = 0

    for template_data in SYSTEM_TEMPLATES:
        try:
            # Create template
            template_create = PromptTemplateCreate(**template_data)
            await repo.create(template_create)
            print(f"✅ Created: {template_data['title']} [{template_data['category']}]")
            created_count += 1

        except Exception as e:
            print(f"❌ Error creating '{template_data['title']}': {str(e)}")

    print(f"\n🎉 Complete! Created {created_count} templates with descriptions")


if __name__ == "__main__":
    asyncio.run(clean_and_reseed())
