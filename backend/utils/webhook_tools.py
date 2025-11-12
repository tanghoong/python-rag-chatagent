"""
Webhook Tools Module

LangChain tools for webhook management and triggering through natural language.
"""

import asyncio
from typing import List, Optional, Callable, Any
from concurrent.futures import ThreadPoolExecutor
from langchain_core.tools import tool
from database.webhook_repository import webhook_repository
from models.webhook_models import (
    WebhookCreate, WebhookUpdate, WebhookStatus,
    WebhookEvent, WebhookAuthType
)
from utils.webhook_utils import trigger_webhooks_for_event

# Thread pool for running async code
_executor = ThreadPoolExecutor(max_workers=1)


def run_async(async_func: Callable, *args, **kwargs) -> Any:
    """Helper to run async code in sync context using a separate thread"""
    def _run_in_thread():
        # Create new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            # Create a new webhook repository instance for this event loop
            from database.webhook_repository import WebhookRepository
            repo = WebhookRepository()

            # If the async_func is a method of webhook_repository, call it on the new instance
            func_name = getattr(async_func, '__name__', None)
            if func_name and hasattr(repo, func_name):
                actual_func = getattr(repo, func_name)
                coro = actual_func(*args, **kwargs)
            else:
                coro = async_func(*args, **kwargs)

            result = loop.run_until_complete(coro)
            return result
        except Exception as e:
            print(f"❌ Error in run_async: {e}")
            import traceback
            traceback.print_exc()
            raise
        finally:
            loop.close()

    future = _executor.submit(_run_in_thread)
    return future.result()


@tool
def create_webhook_tool(
    name: str,
    url: str,
    events: str,
    description: str = "",
    auth_type: str = "none",
    auth_token: str = ""
) -> str:
    """
    Create a new outgoing webhook configuration.
    
    Use this tool when the user wants to:
    - Set up a webhook
    - Create a webhook endpoint
    - Configure webhook notifications
    - Add webhook integration
    
    Args:
        name: Name of the webhook (e.g., "Slack Notification")
        url: Webhook URL endpoint (e.g., "https://hooks.slack.com/services/xxx")
        events: Comma-separated list of events (e.g., "task_completed,reminder_due")
                Available events: task_created, task_updated, task_completed, task_deleted,
                                 reminder_created, reminder_due, reminder_completed,
                                 chat_message, custom
        description: Optional description of what this webhook does
        auth_type: Authentication type: "none", "bearer", "basic", or "api_key"
        auth_token: Authentication token (required for bearer/api_key)
    
    Returns:
        str: Success message with webhook ID or error message
    """
    try:
        # Parse events
        event_list = []
        for event in events.split(","):
            event = event.strip().lower()
            try:
                event_list.append(WebhookEvent(event))
            except ValueError:
                return f"Error: Invalid event type '{event}'. Valid events are: {', '.join([e.value for e in WebhookEvent])}"
        
        if not event_list:
            return "Error: At least one event type is required"
        
        # Parse auth type
        try:
            auth_type_enum = WebhookAuthType(auth_type.lower())
        except ValueError:
            return f"Error: Invalid auth type '{auth_type}'. Valid types are: none, bearer, basic, api_key"
        
        # Create webhook
        webhook_data = WebhookCreate(
            name=name,
            url=url,
            description=description,
            events=event_list,
            auth_type=auth_type_enum,
            auth_token=auth_token if auth_token else None
        )
        
        webhook = run_async(webhook_repository.create, webhook_data)
        
        return f"✅ Webhook '{webhook.name}' created successfully!\nID: {webhook.id}\nURL: {webhook.url}\nEvents: {', '.join([e.value for e in webhook.events])}\nStatus: {webhook.status}"
    
    except Exception as e:
        return f"Error creating webhook: {str(e)}"


@tool
def list_webhooks_tool(status: str = "all") -> str:
    """
    List all configured webhooks.
    
    Use this tool when the user wants to:
    - View webhooks
    - See webhook configurations
    - List webhook settings
    - Check webhook status
    
    Args:
        status: Filter by status: "all", "active", "inactive", or "disabled"
    
    Returns:
        str: List of webhooks with their details
    """
    try:
        # Parse status filter
        status_filter = None
        if status.lower() != "all":
            try:
                status_filter = WebhookStatus(status.lower())
            except ValueError:
                return f"Error: Invalid status '{status}'. Valid statuses are: all, active, inactive, disabled"
        
        # Get webhooks
        webhooks, total = run_async(webhook_repository.list, status=status_filter)
        
        if total == 0:
            return "No webhooks found. Create one using the create_webhook_tool."
        
        result = f"Found {total} webhook(s):\n\n"
        
        for i, webhook in enumerate(webhooks, 1):
            result += f"{i}. **{webhook.name}** (ID: {webhook.id})\n"
            result += f"   URL: {webhook.url}\n"
            result += f"   Status: {webhook.status}\n"
            result += f"   Events: {', '.join([e.value for e in webhook.events])}\n"
            result += f"   Stats: {webhook.total_triggers} triggers ({webhook.success_count} success, {webhook.failure_count} failed)\n"
            if webhook.description:
                result += f"   Description: {webhook.description}\n"
            if webhook.tags:
                result += f"   Tags: {', '.join(webhook.tags)}\n"
            result += "\n"
        
        return result
    
    except Exception as e:
        return f"Error listing webhooks: {str(e)}"


@tool
def get_webhook_details_tool(webhook_id: str) -> str:
    """
    Get detailed information about a specific webhook.
    
    Use this tool when the user wants to:
    - View webhook details
    - Check webhook configuration
    - See webhook statistics
    - Inspect a specific webhook
    
    Args:
        webhook_id: The webhook ID (e.g., "webhook_abc123")
    
    Returns:
        str: Detailed webhook information
    """
    try:
        webhook = run_async(webhook_repository.get, webhook_id)
        
        if not webhook:
            return f"Webhook with ID '{webhook_id}' not found."
        
        result = f"**{webhook.name}**\n\n"
        result += f"ID: {webhook.id}\n"
        result += f"URL: {webhook.url}\n"
        result += f"Status: {webhook.status}\n"
        result += f"Events: {', '.join([e.value for e in webhook.events])}\n\n"
        
        if webhook.description:
            result += f"Description: {webhook.description}\n\n"
        
        result += f"**Configuration:**\n"
        result += f"- Authentication: {webhook.auth_type}\n"
        result += f"- Retry Enabled: {webhook.retry_enabled}\n"
        result += f"- Retry Count: {webhook.retry_count}\n"
        result += f"- Timeout: {webhook.timeout_seconds}s\n\n"
        
        result += f"**Statistics:**\n"
        result += f"- Total Triggers: {webhook.total_triggers}\n"
        result += f"- Successful: {webhook.success_count}\n"
        result += f"- Failed: {webhook.failure_count}\n"
        
        if webhook.total_triggers > 0:
            success_rate = (webhook.success_count / webhook.total_triggers) * 100
            result += f"- Success Rate: {success_rate:.1f}%\n"
        
        if webhook.last_triggered_at:
            result += f"- Last Triggered: {webhook.last_triggered_at}\n"
        
        if webhook.tags:
            result += f"\nTags: {', '.join(webhook.tags)}\n"
        
        result += f"\nCreated: {webhook.created_at}\n"
        result += f"Updated: {webhook.updated_at}"
        
        return result
    
    except Exception as e:
        return f"Error getting webhook details: {str(e)}"


@tool
def update_webhook_tool(
    webhook_id: str,
    name: str = "",
    url: str = "",
    events: str = "",
    status: str = "",
    description: str = ""
) -> str:
    """
    Update an existing webhook configuration.
    
    Use this tool when the user wants to:
    - Modify webhook settings
    - Update webhook URL
    - Change webhook events
    - Enable/disable a webhook
    
    Args:
        webhook_id: The webhook ID to update
        name: New name (optional)
        url: New URL (optional)
        events: New comma-separated event list (optional)
        status: New status: "active", "inactive", or "disabled" (optional)
        description: New description (optional)
    
    Returns:
        str: Success message or error message
    """
    try:
        # Check if webhook exists
        existing = run_async(webhook_repository.get, webhook_id)
        if not existing:
            return f"Webhook with ID '{webhook_id}' not found."
        
        # Prepare update data
        update_data = {}
        
        if name:
            update_data["name"] = name
        if url:
            update_data["url"] = url
        if description:
            update_data["description"] = description
        
        if events:
            event_list = []
            for event in events.split(","):
                event = event.strip().lower()
                try:
                    event_list.append(WebhookEvent(event))
                except ValueError:
                    return f"Error: Invalid event type '{event}'"
            update_data["events"] = event_list
        
        if status:
            try:
                update_data["status"] = WebhookStatus(status.lower())
            except ValueError:
                return f"Error: Invalid status '{status}'. Valid statuses are: active, inactive, disabled"
        
        if not update_data:
            return "No updates provided. Please specify at least one field to update."
        
        # Update webhook
        webhook_update = WebhookUpdate(**update_data)
        updated_webhook = run_async(webhook_repository.update, webhook_id, webhook_update)
        
        return f"✅ Webhook '{updated_webhook.name}' updated successfully!\nID: {updated_webhook.id}\nStatus: {updated_webhook.status}"
    
    except Exception as e:
        return f"Error updating webhook: {str(e)}"


@tool
def delete_webhook_tool(webhook_id: str) -> str:
    """
    Delete a webhook configuration.
    
    Use this tool when the user wants to:
    - Remove a webhook
    - Delete webhook configuration
    - Unregister a webhook
    
    Args:
        webhook_id: The webhook ID to delete
    
    Returns:
        str: Success message or error message
    """
    try:
        # Check if webhook exists
        webhook = run_async(webhook_repository.get, webhook_id)
        if not webhook:
            return f"Webhook with ID '{webhook_id}' not found."
        
        # Delete webhook
        success = run_async(webhook_repository.delete, webhook_id)
        
        if success:
            return f"✅ Webhook '{webhook.name}' (ID: {webhook_id}) deleted successfully!"
        else:
            return f"Failed to delete webhook with ID '{webhook_id}'."
    
    except Exception as e:
        return f"Error deleting webhook: {str(e)}"


@tool
def trigger_custom_webhook_tool(webhook_id: str, data: str) -> str:
    """
    Manually trigger a specific webhook with custom data.
    
    Use this tool when the user wants to:
    - Test a webhook
    - Send a manual webhook
    - Trigger webhook with custom payload
    
    Args:
        webhook_id: The webhook ID to trigger
        data: Custom data to send (will be parsed as JSON-like text)
    
    Returns:
        str: Success message or error message
    """
    try:
        # Check if webhook exists
        webhook = run_async(webhook_repository.get, webhook_id)
        if not webhook:
            return f"Webhook with ID '{webhook_id}' not found."
        
        # Parse data (simple key:value pairs)
        payload = {"message": data, "triggered_by": "manual"}
        
        # Import send_webhook here to avoid circular imports
        from utils.webhook_utils import send_webhook
        
        # Trigger webhook
        success, log = run_async(
            send_webhook,
            webhook,
            WebhookEvent.CUSTOM,
            payload
        )
        
        if success:
            return f"✅ Webhook '{webhook.name}' triggered successfully!\nResponse: {log.response_status_code} - {log.response_body[:200]}"
        else:
            return f"❌ Webhook '{webhook.name}' failed.\nError: {log.error_message}"
    
    except Exception as e:
        return f"Error triggering webhook: {str(e)}"


def get_webhook_tools() -> List:
    """
    Get list of webhook management tools for the agent.
    
    Returns:
        List: List of LangChain webhook tools
    """
    return [
        create_webhook_tool,
        list_webhooks_tool,
        get_webhook_details_tool,
        update_webhook_tool,
        delete_webhook_tool,
        trigger_custom_webhook_tool
    ]


# For testing
if __name__ == "__main__":
    print("Testing webhook tools...")
    tools = get_webhook_tools()
    print(f"Loaded {len(tools)} webhook tools:")
    for tool in tools:
        print(f"  - {tool.name}")
