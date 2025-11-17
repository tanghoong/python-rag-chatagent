"""
Webhook Utilities Module

Utilities for sending webhook HTTP requests with retry logic and error handling.
"""

import asyncio
import time
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
import aiohttp
import base64
from models.webhook_models import (
    Webhook, WebhookAuthType, WebhookEvent,
    WebhookLog, WebhookLogStatus
)
from database.webhook_repository import webhook_repository


async def send_webhook(
    webhook: Webhook,
    event_type: WebhookEvent,
    payload: Dict[str, Any],
    user_id: str = "default_user"
) -> Tuple[bool, Optional[WebhookLog]]:
    """
    Send a webhook HTTP POST request

    Args:
        webhook: Webhook configuration
        event_type: Event type that triggered the webhook
        payload: Data to send in the webhook
        user_id: User identifier

    Returns:
        Tuple of (success, log)
    """
    # Prepare headers
    headers = prepare_headers(webhook)

    # Prepare request data
    request_data = {
        "event": event_type,
        "timestamp": datetime.utcnow().isoformat(),
        "data": payload
    }

    # Try sending with retries
    max_attempts = webhook.retry_count + 1 if webhook.retry_enabled else 1

    for attempt in range(max_attempts):
        try:
            start_time = time.time()

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook.url,
                    json=request_data,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=webhook.timeout_seconds)
                ) as response:
                    response_time_ms = int((time.time() - start_time) * 1000)
                    response_body = await response.text()

                    # Check if successful
                    success = 200 <= response.status < 300

                    # Create log
                    log_data = {
                        "webhook_id": webhook.id,
                        "event_type": event_type,
                        "status": WebhookLogStatus.SUCCESS if success else WebhookLogStatus.FAILURE,
                        "request_url": webhook.url,
                        "request_payload": request_data,
                        "request_headers": sanitize_headers(headers),
                        "response_status_code": response.status,
                        "response_body": response_body[:1000],  # Limit response body size
                        "response_time_ms": response_time_ms,
                        "retry_attempt": attempt,
                        "user_id": user_id
                    }

                    if not success:
                        log_data["error_message"] = f"HTTP {response.status}: {response_body[:200]}"

                    log = await webhook_repository.create_log(log_data)

                    # Update webhook statistics
                    await webhook_repository.increment_stats(
                        webhook.id,
                        success=success,
                        triggered_at=datetime.utcnow()
                    )

                    if success:
                        print(f"✅ Webhook {webhook.name} triggered successfully (attempt {attempt + 1})")
                        return True, log
                    else:
                        print(f"⚠️ Webhook {webhook.name} failed with status {response.status} (attempt {attempt + 1})")

                        # If retry is disabled or this was the last attempt, return failure
                        if not webhook.retry_enabled or attempt == max_attempts - 1:
                            return False, log

                        # Wait before retry (exponential backoff)
                        if attempt < max_attempts - 1:
                            wait_time = min(2 ** attempt, 30)  # Max 30 seconds
                            await asyncio.sleep(wait_time)

        except asyncio.TimeoutError:
            error_msg = f"Request timed out after {webhook.timeout_seconds} seconds"
            print(f"❌ Webhook {webhook.name} timeout (attempt {attempt + 1}): {error_msg}")

            # Create failure log
            log_data = {
                "webhook_id": webhook.id,
                "event_type": event_type,
                "status": WebhookLogStatus.FAILURE,
                "request_url": webhook.url,
                "request_payload": request_data,
                "request_headers": sanitize_headers(headers),
                "error_message": error_msg,
                "retry_attempt": attempt,
                "user_id": user_id
            }

            log = await webhook_repository.create_log(log_data)

            # If this was the last attempt, update stats and return failure
            if not webhook.retry_enabled or attempt == max_attempts - 1:
                await webhook_repository.increment_stats(
                    webhook.id,
                    success=False,
                    triggered_at=datetime.utcnow()
                )
                return False, log

            # Wait before retry
            if attempt < max_attempts - 1:
                wait_time = min(2 ** attempt, 30)
                await asyncio.sleep(wait_time)

        except Exception as e:
            error_msg = f"Error sending webhook: {str(e)}"
            print(f"❌ Webhook {webhook.name} error (attempt {attempt + 1}): {error_msg}")

            # Create failure log
            log_data = {
                "webhook_id": webhook.id,
                "event_type": event_type,
                "status": WebhookLogStatus.FAILURE,
                "request_url": webhook.url,
                "request_payload": request_data,
                "request_headers": sanitize_headers(headers),
                "error_message": error_msg,
                "retry_attempt": attempt,
                "user_id": user_id
            }

            log = await webhook_repository.create_log(log_data)

            # If this was the last attempt, update stats and return failure
            if not webhook.retry_enabled or attempt == max_attempts - 1:
                await webhook_repository.increment_stats(
                    webhook.id,
                    success=False,
                    triggered_at=datetime.utcnow()
                )
                return False, log

            # Wait before retry
            if attempt < max_attempts - 1:
                wait_time = min(2 ** attempt, 30)
                await asyncio.sleep(wait_time)

    # Should never reach here, but just in case
    return False, None


def prepare_headers(webhook: Webhook) -> Dict[str, str]:
    """
    Prepare HTTP headers for webhook request

    Args:
        webhook: Webhook configuration

    Returns:
        Dictionary of headers
    """
    headers = {"Content-Type": "application/json"}

    # Add custom headers with validation
    # Security: Prevent header injection by validating header names and values
    ALLOWED_HEADERS = {
        "User-Agent", "Accept", "Accept-Encoding", "Accept-Language",
        "X-Custom-Header", "X-Request-ID", "X-Correlation-ID"
    }
    for key, value in webhook.headers.items():
        # Validate header name (alphanumeric, dash, underscore only)
        if key in ALLOWED_HEADERS and isinstance(value, str):
            # Remove any newline characters to prevent header injection
            clean_value = value.replace('\r', '').replace('\n', '')
            headers[key] = clean_value

    # Add authentication
    if webhook.auth_type == WebhookAuthType.BEARER and webhook.auth_token:
        headers["Authorization"] = f"Bearer {webhook.auth_token}"

    elif webhook.auth_type == WebhookAuthType.API_KEY and webhook.auth_token:
        headers["X-API-Key"] = webhook.auth_token

    elif webhook.auth_type == WebhookAuthType.BASIC and webhook.auth_username and webhook.auth_password:
        credentials = f"{webhook.auth_username}:{webhook.auth_password}"
        encoded = base64.b64encode(credentials.encode()).decode()
        headers["Authorization"] = f"Basic {encoded}"

    return headers


def sanitize_headers(headers: Dict[str, str]) -> Dict[str, str]:
    """
    Sanitize headers for logging (remove sensitive data)

    Args:
        headers: Original headers

    Returns:
        Sanitized headers
    """
    sanitized = headers.copy()

    # Mask sensitive headers
    sensitive_keys = ["Authorization", "X-API-Key", "X-Auth-Token"]
    for key in sensitive_keys:
        if key in sanitized:
            sanitized[key] = "***REDACTED***"

    return sanitized


async def trigger_webhooks_for_event(
    event_type: WebhookEvent,
    payload: Dict[str, Any],
    user_id: str = "default_user"
) -> int:
    """
    Trigger all active webhooks for a specific event type

    Args:
        event_type: Event type that occurred
        payload: Event data
        user_id: User identifier

    Returns:
        Number of webhooks triggered
    """
    # Get all active webhooks for this event
    webhooks = await webhook_repository.get_by_event(event_type, user_id)

    if not webhooks:
        print(f"ℹ️ No active webhooks found for event: {event_type}")
        return 0

    print(f"🔔 Triggering {len(webhooks)} webhook(s) for event: {event_type}")

    # Trigger all webhooks concurrently
    tasks = [
        send_webhook(webhook, event_type, payload, user_id)
        for webhook in webhooks
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Count successful triggers
    success_count = sum(1 for result in results if isinstance(result, tuple) and result[0])

    print(f"✅ Successfully triggered {success_count}/{len(webhooks)} webhook(s)")

    return len(webhooks)


def format_task_payload(task: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format task data for webhook payload

    Args:
        task: Task data

    Returns:
        Formatted payload
    """
    return {
        "id": task.get("id"),
        "title": task.get("title"),
        "description": task.get("description"),
        "status": task.get("status"),
        "priority": task.get("priority"),
        "tags": task.get("tags", []),
        "created_at": task.get("created_at"),
        "updated_at": task.get("updated_at")
    }


def format_reminder_payload(reminder: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format reminder data for webhook payload

    Args:
        reminder: Reminder data

    Returns:
        Formatted payload
    """
    return {
        "id": reminder.get("id"),
        "title": reminder.get("title"),
        "description": reminder.get("description"),
        "due_date": reminder.get("due_date"),
        "priority": reminder.get("priority"),
        "status": reminder.get("status"),
        "tags": reminder.get("tags", []),
        "recurrence_type": reminder.get("recurrence_type"),
        "created_at": reminder.get("created_at")
    }


def format_chat_payload(message: str, chat_id: str, response: str = None) -> Dict[str, Any]:
    """
    Format chat message data for webhook payload

    Args:
        message: User message
        chat_id: Chat session ID
        response: AI response (optional)

    Returns:
        Formatted payload
    """
    payload = {
        "chat_id": chat_id,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }

    if response:
        payload["response"] = response

    return payload
