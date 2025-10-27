"""
Reminder Tools Module

LangChain tools for natural language reminder management.
"""

import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from langchain_core.tools import tool
from database.reminder_repository import reminder_repository
from models.reminder_models import (
    ReminderCreate, ReminderUpdate, ReminderStatus, 
    ReminderPriority, RecurrenceType
)
from utils.recurrence_engine import parse_natural_language_time
import re


def run_async(coro):
    """Helper to run async functions in sync context"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(coro)


def parse_priority_from_text(text: str) -> ReminderPriority:
    """Extract priority from text"""
    text_lower = text.lower()
    
    if any(word in text_lower for word in ["urgent", "emergency", "asap", "immediately", "critical"]):
        return ReminderPriority.URGENT
    elif any(word in text_lower for word in ["high", "important", "priority"]):
        return ReminderPriority.HIGH
    elif any(word in text_lower for word in ["low", "minor", "sometime", "eventually"]):
        return ReminderPriority.LOW
    else:
        return ReminderPriority.MEDIUM


def parse_tags_from_text(text: str) -> List[str]:
    """Extract tags from text using #hashtags or 'tags:' syntax"""
    tags = []
    
    # Extract hashtags
    hashtags = re.findall(r'#(\w+)', text)
    tags.extend(hashtags)
    
    # Extract from 'tags:' syntax
    tags_match = re.search(r'tags?:\s*([^,\n]+)', text, re.IGNORECASE)
    if tags_match:
        tags_text = tags_match.group(1)
        tags_list = [tag.strip() for tag in tags_text.split(',')]
        tags.extend(tags_list)
    
    return list(set(tags))  # Remove duplicates


def parse_due_date_from_text(text: str) -> Optional[datetime]:
    """Extract due date from natural language text"""
    # Try to parse natural language time expressions
    due_date = parse_natural_language_time(text)
    if due_date:
        return due_date
    
    # Default to 1 hour from now if no time specified
    return datetime.utcnow() + timedelta(hours=1)


def parse_recurrence_from_text(text: str) -> Dict[str, Any]:
    """Extract recurrence settings from text"""
    text_lower = text.lower()
    
    recurrence_data = {
        "recurrence_type": RecurrenceType.NONE,
        "recurrence_interval": 1,
        "recurrence_days_of_week": [],
        "recurrence_day_of_month": None
    }
    
    # Check for recurrence patterns
    if any(word in text_lower for word in ["every day", "daily"]):
        recurrence_data["recurrence_type"] = RecurrenceType.DAILY
    elif any(word in text_lower for word in ["every week", "weekly"]):
        recurrence_data["recurrence_type"] = RecurrenceType.WEEKLY
    elif any(word in text_lower for word in ["every month", "monthly"]):
        recurrence_data["recurrence_type"] = RecurrenceType.MONTHLY
    elif any(word in text_lower for word in ["every hour", "hourly"]):
        recurrence_data["recurrence_type"] = RecurrenceType.HOURLY
    elif "every" in text_lower and "minute" in text_lower:
        recurrence_data["recurrence_type"] = RecurrenceType.MINUTELY
    
    # Parse specific days for weekly recurrence
    if recurrence_data["recurrence_type"] == RecurrenceType.WEEKLY:
        days_map = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6
        }
        
        days_of_week = []
        for day_name, day_num in days_map.items():
            if day_name in text_lower:
                days_of_week.append(day_num)
        
        if days_of_week:
            recurrence_data["recurrence_days_of_week"] = days_of_week
    
    return recurrence_data


@tool
def create_reminder_from_chat(reminder_text: str) -> str:
    """
    Create a reminder from natural language text.
    
    Use this tool when the user wants to:
    - Set a reminder
    - Create a reminder
    - Remember something
    - Be reminded about something
    
    The tool can parse:
    - Due dates/times (e.g., "tomorrow at 3pm", "in 2 hours", "next week")
    - Priority levels (urgent, high, medium, low)
    - Tags using #hashtags or "tags: work, personal"
    - Recurrence patterns ("every day", "weekly", "monthly")
    
    Args:
        reminder_text: Natural language description of the reminder
        
    Returns:
        Confirmation message with reminder details
    """
    try:
        # Parse the reminder text
        title = reminder_text[:100]  # Use first part as title
        description = reminder_text if len(reminder_text) > 100 else None
        
        # Extract components
        priority = parse_priority_from_text(reminder_text)
        tags = parse_tags_from_text(reminder_text)
        due_date = parse_due_date_from_text(reminder_text)
        recurrence_data = parse_recurrence_from_text(reminder_text)
        
        # Create reminder data
        reminder_data = ReminderCreate(
            title=title,
            description=description,
            due_date=due_date,
            priority=priority,
            tags=tags,
            **recurrence_data
        )
        
        # Create reminder
        reminder = run_async(reminder_repository.create(reminder_data))
        
        # Format response
        priority_emoji = {"low": "🔽", "medium": "📌", "high": "⚠️", "urgent": "🔥"}
        recurrence_text = ""
        if recurrence_data["recurrence_type"] != RecurrenceType.NONE:
            recurrence_text = f"\n**Recurrence:** {recurrence_data['recurrence_type']}"
        
        tags_text = f"\n**Tags:** {', '.join(tags)}" if tags else ""
        
        return f"""⏰ **Reminder created successfully!**

**Title:** {reminder.title}
**Due:** {reminder.due_date.strftime('%Y-%m-%d %H:%M UTC')}
**Priority:** {priority_emoji.get(priority, '📌')} {priority}{recurrence_text}{tags_text}

**ID:** {reminder.id}"""
        
    except Exception as e:
        return f"❌ Error creating reminder: {str(e)}"


@tool
def list_reminders_from_chat(
    status: str = "all",
    priority: str = "all", 
    limit: int = 10,
    search: str = ""
) -> str:
    """
    List reminders with optional filters.
    
    Use this tool when the user wants to:
    - See their reminders
    - List upcoming reminders
    - Find specific reminders
    - Check what's due
    
    Args:
        status: Filter by status (all, pending, completed, snoozed, cancelled, overdue)
        priority: Filter by priority (all, low, medium, high, urgent)
        limit: Maximum number of reminders to show (default 10)
        search: Search in title and description
        
    Returns:
        Formatted list of reminders
    """
    try:
        # Convert parameters
        status_filter = None
        if status.lower() in ["pending", "completed", "snoozed", "cancelled"]:
            status_filter = ReminderStatus(status.lower())
        
        priority_filter = None
        if priority.lower() in ["low", "medium", "high", "urgent"]:
            priority_filter = ReminderPriority(priority.lower())
        
        overdue_only = status.lower() == "overdue"
        pending_only = status.lower() == "pending"
        
        # Get reminders
        result = run_async(reminder_repository.list(
            page=1,
            page_size=limit,
            status=status_filter,
            priority=priority_filter,
            search=search if search else None,
            overdue_only=overdue_only,
            pending_only=pending_only
        ))
        
        reminders = result["reminders"]
        total = result["total"]
        
        if not reminders:
            return f"📭 No reminders found matching your criteria."
        
        # Format response
        response = f"📋 **Your Reminders** (Showing {len(reminders)} of {total})\n\n"
        
        status_emoji = {
            "pending": "⏳",
            "completed": "✅", 
            "snoozed": "😴",
            "cancelled": "❌"
        }
        
        priority_emoji = {"low": "🔽", "medium": "📌", "high": "⚠️", "urgent": "🔥"}
        
        now = datetime.utcnow()
        
        for i, reminder in enumerate(reminders, 1):
            status_icon = status_emoji.get(reminder.status, "📌")
            priority_icon = priority_emoji.get(reminder.priority, "📌")
            
            # Check if overdue
            overdue_text = ""
            if reminder.status in [ReminderStatus.PENDING, ReminderStatus.SNOOZED] and reminder.due_date < now:
                overdue_text = " (OVERDUE)"
            
            tags_text = f" #{' #'.join(reminder.tags)}" if reminder.tags else ""
            
            response += f"{i}. {status_icon} {priority_icon} **{reminder.title}**{overdue_text}\n"
            response += f"   Due: {reminder.due_date.strftime('%Y-%m-%d %H:%M')}\n"
            response += f"   Status: {reminder.status} | Priority: {reminder.priority}\n"
            if reminder.description:
                response += f"   Description: {reminder.description[:100]}...\n"
            response += f"   ID: {reminder.id}{tags_text}\n\n"
        
        return response
        
    except Exception as e:
        return f"❌ Error listing reminders: {str(e)}"


@tool
def complete_reminder_from_chat(reminder_id: str) -> str:
    """
    Mark a reminder as completed.
    
    Use this tool when the user wants to:
    - Mark a reminder as done
    - Complete a reminder
    - Finish a reminder
    
    Args:
        reminder_id: The reminder ID to complete
        
    Returns:
        Confirmation message
    """
    try:
        updated = run_async(reminder_repository.update_status(reminder_id, ReminderStatus.COMPLETED))
        
        if not updated:
            return f"❌ Reminder not found: {reminder_id}"
        
        return f"✅ **Reminder completed successfully!**\nID: {reminder_id}"
        
    except Exception as e:
        return f"❌ Error completing reminder: {str(e)}"


@tool
def snooze_reminder_from_chat(reminder_id: str, snooze_duration: str = "1 hour") -> str:
    """
    Snooze a reminder for a specified duration.
    
    Use this tool when the user wants to:
    - Snooze a reminder
    - Postpone a reminder
    - Delay a reminder
    
    Args:
        reminder_id: The reminder ID to snooze
        snooze_duration: How long to snooze (e.g., "1 hour", "30 minutes", "tomorrow")
        
    Returns:
        Confirmation message
    """
    try:
        # Parse snooze duration
        snooze_until = parse_natural_language_time(f"in {snooze_duration}")
        if not snooze_until:
            # Default to 1 hour
            snooze_until = datetime.utcnow() + timedelta(hours=1)
        
        snoozed = run_async(reminder_repository.snooze(reminder_id, snooze_until))
        
        if not snoozed:
            return f"❌ Reminder not found: {reminder_id}"
        
        return f"😴 **Reminder snoozed successfully!**\nID: {reminder_id}\nSnoozed until: {snooze_until.strftime('%Y-%m-%d %H:%M UTC')}"
        
    except Exception as e:
        return f"❌ Error snoozing reminder: {str(e)}"


@tool
def update_reminder_from_chat(reminder_id: str, updates: str) -> str:
    """
    Update a reminder's details.
    
    Use this tool when the user wants to:
    - Edit a reminder
    - Change reminder details
    - Update reminder information
    
    Args:
        reminder_id: The reminder ID to update
        updates: Natural language description of what to update
        
    Returns:
        Confirmation message
    """
    try:
        # Parse updates
        update_data = {}
        
        # Extract new title if mentioned
        if "title:" in updates.lower():
            title_match = re.search(r'title:\s*([^\n,]+)', updates, re.IGNORECASE)
            if title_match:
                update_data["title"] = title_match.group(1).strip()
        
        # Extract new description if mentioned
        if "description:" in updates.lower():
            desc_match = re.search(r'description:\s*([^\n,]+)', updates, re.IGNORECASE)
            if desc_match:
                update_data["description"] = desc_match.group(1).strip()
        
        # Extract new due date if mentioned
        if any(word in updates.lower() for word in ["due", "when", "time", "date"]):
            new_due_date = parse_due_date_from_text(updates)
            if new_due_date:
                update_data["due_date"] = new_due_date
        
        # Extract new priority if mentioned
        if any(word in updates.lower() for word in ["priority", "urgent", "high", "medium", "low"]):
            new_priority = parse_priority_from_text(updates)
            update_data["priority"] = new_priority
        
        # Extract new tags if mentioned
        new_tags = parse_tags_from_text(updates)
        if new_tags:
            update_data["tags"] = new_tags
        
        if not update_data:
            return "❌ No valid updates found in the text. Please specify what you want to update."
        
        # Create update object
        reminder_update = ReminderUpdate(**update_data)
        
        # Update reminder
        updated_reminder = run_async(reminder_repository.update(reminder_id, reminder_update))
        
        if not updated_reminder:
            return f"❌ Reminder not found: {reminder_id}"
        
        # Format response
        updates_text = []
        for field, value in update_data.items():
            if field == "due_date":
                updates_text.append(f"Due date: {value.strftime('%Y-%m-%d %H:%M UTC')}")
            elif field == "tags":
                updates_text.append(f"Tags: {', '.join(value)}")
            else:
                updates_text.append(f"{field.replace('_', ' ').title()}: {value}")
        
        return f"""✏️ **Reminder updated successfully!**

**ID:** {reminder_id}
**Updates:**
{chr(10).join(['- ' + update for update in updates_text])}"""
        
    except Exception as e:
        return f"❌ Error updating reminder: {str(e)}"


@tool
def delete_reminder_from_chat(reminder_id: str) -> str:
    """
    Delete a reminder.
    
    Use this tool when the user wants to:
    - Delete a reminder
    - Remove a reminder
    - Cancel a reminder permanently
    
    Args:
        reminder_id: The reminder ID to delete
        
    Returns:
        Confirmation message
    """
    try:
        deleted = run_async(reminder_repository.delete(reminder_id))
        
        if not deleted:
            return f"❌ Reminder not found: {reminder_id}"
        
        return f"🗑️ **Reminder deleted successfully!**\nID: {reminder_id}"
        
    except Exception as e:
        return f"❌ Error deleting reminder: {str(e)}"


@tool
def get_reminder_stats_from_chat() -> str:
    """
    Get reminder statistics and overview.
    
    Use this tool when the user wants to:
    - See reminder statistics
    - Get an overview of their reminders
    - Check reminder counts
    
    Returns:
        Formatted statistics
    """
    try:
        stats = run_async(reminder_repository.get_stats())
        
        return f"""📊 **Reminder Statistics**

**Total Reminders:** {stats['total']}

**By Status:**
⏳ Pending: {stats['pending']}
✅ Completed: {stats['completed']}
😴 Snoozed: {stats['snoozed']}
❌ Cancelled: {stats['cancelled']}

**Important:**
🚨 Overdue: {stats['overdue']}
📅 Due Today: {stats['due_today']}
📆 Due This Week: {stats['due_this_week']}

**By Priority:**
🔥 Urgent: {stats['by_priority']['urgent']}
⚠️ High: {stats['by_priority']['high']}
📌 Medium: {stats['by_priority']['medium']}
🔽 Low: {stats['by_priority']['low']}

**Recent Activity:**
✅ Completed Last 7 Days: {stats['recent_completed']}"""
        
    except Exception as e:
        return f"❌ Error retrieving reminder statistics: {str(e)}"


def get_reminder_tools():
    """
    Get list of all reminder management tools
    
    Returns:
        List of reminder management tools
    """
    return [
        create_reminder_from_chat,
        list_reminders_from_chat,
        complete_reminder_from_chat,
        snooze_reminder_from_chat,
        update_reminder_from_chat,
        delete_reminder_from_chat,
        get_reminder_stats_from_chat
    ]