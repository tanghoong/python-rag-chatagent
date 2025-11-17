"""
Test Webhook Module

Basic tests for webhook functionality.
"""

from database.webhook_repository import webhook_repository
from models.webhook_models import (
    WebhookCreate, WebhookEvent, WebhookAuthType, WebhookStatus
)
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))


async def test_webhook_crud():
    """Test basic CRUD operations for webhooks"""
    print("\n=== Testing Webhook CRUD Operations ===\n")

    # Test 1: Create a webhook
    print("1. Testing webhook creation...")
    webhook_data = WebhookCreate(
        name="Test Slack Webhook",
        url="https://hooks.slack.com/services/TEST/TEST/TEST",
        description="Test webhook for Slack notifications",
        events=[WebhookEvent.TASK_COMPLETED, WebhookEvent.REMINDER_DUE],
        status=WebhookStatus.ACTIVE,
        auth_type=WebhookAuthType.NONE,
        tags=["test", "slack"]
    )

    try:
        webhook = await webhook_repository.create(webhook_data)
        print(f"✅ Created webhook: {webhook.name} (ID: {webhook.id})")
        webhook_id = webhook.id
    except Exception as e:
        print(f"❌ Failed to create webhook: {e}")
        return

    # Test 2: Get webhook by ID
    print("\n2. Testing webhook retrieval...")
    try:
        retrieved = await webhook_repository.get(webhook_id)
        if retrieved:
            print(f"✅ Retrieved webhook: {retrieved.name}")
            print(f"   URL: {retrieved.url}")
            print(f"   Events: {[e.value for e in retrieved.events]}")
            print(f"   Status: {retrieved.status}")
        else:
            print("❌ Webhook not found")
    except Exception as e:
        print(f"❌ Failed to retrieve webhook: {e}")

    # Test 3: List webhooks
    print("\n3. Testing webhook listing...")
    try:
        webhooks, total = await webhook_repository.list(page=1, page_size=10)
        print(f"✅ Found {total} webhook(s)")
        for wh in webhooks:
            print(f"   - {wh.name} ({wh.status})")
    except Exception as e:
        print(f"❌ Failed to list webhooks: {e}")

    # Test 4: Update webhook
    print("\n4. Testing webhook update...")
    try:
        from models.webhook_models import WebhookUpdate
        update_data = WebhookUpdate(
            description="Updated test webhook",
            status=WebhookStatus.INACTIVE
        )
        updated = await webhook_repository.update(webhook_id, update_data)
        if updated:
            print("✅ Updated webhook")
            print(f"   New description: {updated.description}")
            print(f"   New status: {updated.status}")
        else:
            print("❌ Webhook not found for update")
    except Exception as e:
        print(f"❌ Failed to update webhook: {e}")

    # Test 5: Get webhooks by event
    print("\n5. Testing get webhooks by event...")
    try:
        # First, set webhook back to active for this test
        update_data = WebhookUpdate(status=WebhookStatus.ACTIVE)
        await webhook_repository.update(webhook_id, update_data)

        event_webhooks = await webhook_repository.get_by_event(WebhookEvent.TASK_COMPLETED)
        print(f"✅ Found {len(event_webhooks)} active webhook(s) for TASK_COMPLETED event")
        for wh in event_webhooks:
            print(f"   - {wh.name}")
    except Exception as e:
        print(f"❌ Failed to get webhooks by event: {e}")

    # Test 6: Get statistics
    print("\n6. Testing webhook statistics...")
    try:
        stats = await webhook_repository.get_stats()
        print("✅ Webhook statistics:")
        print(f"   Total webhooks: {stats['total_webhooks']}")
        print(f"   Active webhooks: {stats['active_webhooks']}")
        print(f"   Total triggers: {stats['total_triggers']}")
        print(f"   Success rate: {stats['success_rate']}%")
    except Exception as e:
        print(f"❌ Failed to get statistics: {e}")

    # Test 7: Get tags
    print("\n7. Testing get all tags...")
    try:
        tags = await webhook_repository.get_all_tags()
        print(f"✅ Found {len(tags)} unique tag(s): {', '.join(tags)}")
    except Exception as e:
        print(f"❌ Failed to get tags: {e}")

    # Test 8: Delete webhook
    print("\n8. Testing webhook deletion...")
    try:
        success = await webhook_repository.delete(webhook_id)
        if success:
            print(f"✅ Deleted webhook: {webhook_id}")
        else:
            print("❌ Webhook not found for deletion")
    except Exception as e:
        print(f"❌ Failed to delete webhook: {e}")

    print("\n=== Webhook CRUD Tests Complete ===\n")


async def test_webhook_tools():
    """Test LangChain webhook tools"""
    print("\n=== Testing Webhook Tools ===\n")

    try:
        from utils.webhook_tools import get_webhook_tools

        tools = get_webhook_tools()
        print(f"✅ Loaded {len(tools)} webhook tools:")
        for tool in tools:
            print(f"   - {tool.name}: {tool.description[:80]}...")

        print("\nTesting create_webhook_tool...")
        from utils.webhook_tools import create_webhook_tool

        result = create_webhook_tool.invoke({
            "name": "Test Discord Webhook",
            "url": "https://discord.com/api/webhooks/TEST/TEST",
            "events": "task_completed,reminder_due",
            "description": "Test Discord notifications",
            "auth_type": "none",
            "auth_token": ""
        })
        print(f"Tool result:\n{result}\n")

        print("Testing list_webhooks_tool...")
        from utils.webhook_tools import list_webhooks_tool

        result = list_webhooks_tool.invoke({"status": "all"})
        print(f"Tool result:\n{result}\n")

        print("✅ Webhook tools are working correctly")

    except Exception as e:
        print(f"❌ Error testing webhook tools: {e}")
        import traceback
        traceback.print_exc()

    print("\n=== Webhook Tools Tests Complete ===\n")


async def cleanup_test_webhooks():
    """Clean up test webhooks"""
    print("\n=== Cleaning up test webhooks ===\n")

    try:
        webhooks, total = await webhook_repository.list(page=1, page_size=100)
        test_webhooks = [wh for wh in webhooks if "test" in wh.name.lower() or "Test" in wh.name]

        for webhook in test_webhooks:
            await webhook_repository.delete(webhook.id)
            print(f"✅ Deleted test webhook: {webhook.name}")

        print(f"\n✅ Cleaned up {len(test_webhooks)} test webhook(s)")
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")


async def main():
    """Run all tests"""
    print("╔════════════════════════════════════════════════════╗")
    print("║     Webhook Module Test Suite                      ║")
    print("╚════════════════════════════════════════════════════╝")

    try:
        # Clean up any existing test webhooks first
        await cleanup_test_webhooks()

        # Run tests
        await test_webhook_crud()
        await test_webhook_tools()

        # Clean up after tests
        await cleanup_test_webhooks()

        print("\n╔════════════════════════════════════════════════════╗")
        print("║     All Tests Complete!                            ║")
        print("╚════════════════════════════════════════════════════╝\n")

    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Note: This requires MongoDB to be running
    print("⚠️  Note: This test requires MongoDB to be running")
    print("    Connection string: mongodb://localhost:27017/rag_chatbot\n")

    asyncio.run(main())
