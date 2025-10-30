"""
Reminder Tools Module

LangChain tools for natural language reminder management.
"""

import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Callable
from concurrent.futures import ThreadPoolExecutor
from contextvars import ContextVar
from langchain_core.tools import tool
from database.reminder_repository import reminder_repository
from models.reminder_models import (
    ReminderCreate, ReminderUpdate, ReminderStatus, 
    ReminderPriority, RecurrenceType
)
from utils.recurrence_engine import parse_natural_language_time
import re

# Thread pool for running async code
_executor = ThreadPoolExecutor(max_workers=1)

# Context variable to track the last reminder ID in the conversation
last_reminder_id: ContextVar[Optional[str]] = ContextVar('last_reminder_id', default=None)


def run_async(async_func: Callable, *args, **kwargs) -> Any:
    """Helper to run async code in sync context using a separate thread"""
    def _run_in_thread():
        # Create new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            # Create a new reminder repository instance for this event loop
            from database.reminder_repository import ReminderRepository
            repo = ReminderRepository()

            # If the async_func is a method of reminder_repository, call it on the new instance
            func_name = getattr(async_func, '__name__', None)
            if func_name and hasattr(repo, func_name):
                actual_func = getattr(repo, func_name)
                coro = actual_func(*args, **kwargs)
            else:
                coro = async_func(*args, **kwargs)

            # Ensure we're running the coroutine, not a task
            if asyncio.iscoroutine(coro):
                result = loop.run_until_complete(coro)
            else:
                # If it's already a result (shouldn't happen), return it
                result = coro
            
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
    """Extract recurrence settings from text - enhanced with more patterns"""
    text_lower = text.lower()
    
    recurrence_data = {
        "recurrence_type": RecurrenceType.NONE,
        "recurrence_interval": 1,
        "recurrence_days_of_week": [],
        "recurrence_day_of_month": None
    }
    
    # Check for recurrence patterns - enhanced detection
    daily_patterns = ["every day", "daily", "each day", "every single day"]
    weekly_patterns = ["every week", "weekly", "each week"]
    monthly_patterns = ["every month", "monthly", "each month"]
    hourly_patterns = ["every hour", "hourly", "each hour"]
    minutely_patterns = ["every minute", "minutely", "each minute"]
    
    if any(pattern in text_lower for pattern in daily_patterns):
        recurrence_data["recurrence_type"] = RecurrenceType.DAILY
    elif any(pattern in text_lower for pattern in weekly_patterns):
        recurrence_data["recurrence_type"] = RecurrenceType.WEEKLY
    elif any(pattern in text_lower for pattern in monthly_patterns):
        recurrence_data["recurrence_type"] = RecurrenceType.MONTHLY
    elif any(pattern in text_lower for pattern in hourly_patterns):
        recurrence_data["recurrence_type"] = RecurrenceType.HOURLY
    elif any(pattern in text_lower for pattern in minutely_patterns):
        recurrence_data["recurrence_type"] = RecurrenceType.MINUTELY
    
    # Detect weekly recurrence from specific day mentions
    days_map = {
        "monday": 0, "mon": 0,
        "tuesday": 1, "tue": 1, "tues": 1,
        "wednesday": 2, "wed": 2,
        "thursday": 3, "thu": 3, "thur": 3, "thurs": 3,
        "friday": 4, "fri": 4,
        "saturday": 5, "sat": 5,
        "sunday": 6, "sun": 6
    }
    
    # Check if specific days are mentioned
    mentioned_days = []
    for day_name, day_num in days_map.items():
        if day_name in text_lower:
            if day_num not in mentioned_days:
                mentioned_days.append(day_num)
    
    # If days are mentioned with "every" or "each", it's weekly recurrence
    if mentioned_days and any(word in text_lower for word in ["every", "each", "repeat"]):
        recurrence_data["recurrence_type"] = RecurrenceType.WEEKLY
        recurrence_data["recurrence_days_of_week"] = sorted(mentioned_days)
    elif recurrence_data["recurrence_type"] == RecurrenceType.WEEKLY and mentioned_days:
        # Already set to weekly, just add the days
        recurrence_data["recurrence_days_of_week"] = sorted(mentioned_days)
    
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
    - Multi-line input: First line becomes the title, subsequent lines become the description
    
    Examples:
    - "Remind me to call John tomorrow at 3pm #work"
    - "Set a reminder for the meeting in 2 hours\nBring the presentation slides and notes"
    - "Reminder: Submit report next Friday #urgent\nIncludes Q3 analysis and projections"
    
    Args:
        reminder_text: Natural language description of the reminder (can be multi-line)
        
    Returns:
        Confirmation message with reminder details
    """
    try:
        # Parse the reminder text - handle multi-line input
        lines = reminder_text.strip().split('\n')
        
        # First line is the main reminder, rest is description/details
        first_line = lines[0].strip()
        
        # Extract a clean title from the first line (remove time/date phrases for cleaner title)
        title_line = first_line
        # Remove common time phrases to get cleaner title
        time_patterns = [
            r'\s+tomorrow(\s+at\s+\d+[:\d]*\s*(?:am|pm)?)?',
            r'\s+today(\s+at\s+\d+[:\d]*\s*(?:am|pm)?)?',
            r'\s+at\s+\d+[:\d]*\s*(?:am|pm)?',
            r'\s+in\s+\d+\s+(?:hour|minute|day|week)s?',
            r'\s+next\s+(?:week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)',
        ]
        for pattern in time_patterns:
            title_line = re.sub(pattern, '', title_line, flags=re.IGNORECASE)
        
        # Remove common action words at the start for cleaner title
        title_line = re.sub(r'^(?:remind me to|reminder to|remind|set a reminder to|create a reminder to)\s+', '', 
                           title_line, flags=re.IGNORECASE)
        
        # Remove hashtags from title (they'll be parsed separately)
        title_clean = re.sub(r'\s*#\w+\s*', ' ', title_line).strip()
        
        # Use the cleaned title, limit to 100 chars
        title = title_clean[:100] if title_clean else first_line[:100]
        
        # If there are additional lines, use them as description
        description = None
        if len(lines) > 1:
            # Join remaining lines as description
            description_lines = [line.strip() for line in lines[1:] if line.strip()]
            if description_lines:
                description = '\n'.join(description_lines)
        
        # If no description from multiple lines but text is very long, use full text as description
        if not description and len(reminder_text) > 150:
            description = reminder_text
        
        # Extract components from the full text
        priority = parse_priority_from_text(reminder_text)
        tags = parse_tags_from_text(reminder_text)
        due_date = parse_due_date_from_text(reminder_text)
        
        # Ensure due_date is never None
        if due_date is None:
            due_date = datetime.utcnow() + timedelta(hours=1)
        
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
        
        # Ensure indexes first
        run_async(reminder_repository.ensure_indexes)
        
        # Create reminder
        reminder = run_async(reminder_repository.create, reminder_data)
        
        # Store the reminder ID in context for potential updates
        last_reminder_id.set(reminder.id)
        
        # Format response
        priority_emoji = {"low": "🔽", "medium": "📌", "high": "⚠️", "urgent": "🔥"}
        recurrence_text = ""
        if recurrence_data["recurrence_type"] != RecurrenceType.NONE:
            recurrence_text = f"\n**Recurrence:** {recurrence_data['recurrence_type']}"
        
        tags_text = f"\n**Tags:** {', '.join(tags)}" if tags else ""
        
        description_text = ""
        if reminder.description:
            # Truncate long descriptions in response
            desc_preview = reminder.description[:200] + "..." if len(reminder.description) > 200 else reminder.description
            description_text = f"\n**Details:** {desc_preview}"
        
        return f"""⏰ **Reminder created successfully!**

**Title:** {reminder.title}
**Due:** {reminder.due_date.strftime('%Y-%m-%d %H:%M UTC')}
**Priority:** {priority_emoji.get(priority, '📌')} {priority}{recurrence_text}{tags_text}{description_text}

**ID:** {reminder.id}"""
        
    except Exception as e:
        print(f"❌ Error creating reminder: {e}")
        import traceback
        traceback.print_exc()
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
        result = run_async(
            reminder_repository.list,
            page=1,
            page_size=limit,
            status=status_filter,
            priority=priority_filter,
            search=search if search else None,
            overdue_only=overdue_only,
            pending_only=pending_only
        )
        
        reminders = result["reminders"]
        total = result["total"]
        
        if not reminders:
            return "📭 No reminders found matching your criteria."
        
        # Store the first reminder ID in context (useful if user wants to reference it)
        if reminders:
            last_reminder_id.set(reminders[0].id)
        
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
            
            # Check if overdue - ensure both datetimes are timezone-naive
            overdue_text = ""
            if reminder.status in [ReminderStatus.PENDING, ReminderStatus.SNOOZED]:
                # Ensure both datetimes are timezone-naive for comparison
                reminder_due = reminder.due_date
                if reminder_due.tzinfo is not None:
                    # Convert to naive UTC if timezone-aware
                    reminder_due = reminder_due.replace(tzinfo=None)
                
                if reminder_due < now:
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
        updated = run_async(reminder_repository.update_status, reminder_id, ReminderStatus.COMPLETED)
        
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
        
        snoozed = run_async(reminder_repository.snooze, reminder_id, snooze_until)
        
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
        updated_reminder = run_async(reminder_repository.update, reminder_id, reminder_update)
        
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
        print(f"❌ Error updating reminder: {e}")
        import traceback
        traceback.print_exc()
        return f"❌ Error updating reminder: {str(e)}"


@tool
def update_last_reminder_from_chat(updates: str) -> str:
    """
    Update the most recently created or mentioned reminder in this conversation.
    
    Use this tool when the user wants to modify ANY aspect of a reminder in the same conversation.
    
    THIS IS THE DEFAULT TOOL for updates - use even WITHOUT explicit "this/that reminder" references.
    
    Use this tool when the user says:
    - Time/Date changes: "make it Friday", "change to 2pm", "tomorrow at 5pm"
    - Priority: "make it urgent", "high priority", "change priority"
    - Description: "add details", "include notes", "add: bring documents"
    - Tags: "add tag #work", "tag as important", "#urgent #critical"
    - Recurrence: "make it daily", "every week", "repeat every Monday", "every day at 8am"
    - ANY modification without specifying a reminder ID
    
    Examples triggering this tool:
    - "Make it Friday at 2pm" (no explicit reference needed)
    - "Change priority to urgent" (no explicit reference needed)
    - "Add details: bring contract" (no explicit reference needed)
    - "Make it a daily reminder" (adds recurrence)
    - "Every Monday and Wednesday" (sets weekly recurrence with specific days)
    - "Repeat hourly" (sets hourly recurrence)
    
    Args:
        updates: Natural language description of what to update
        
    Returns:
        Confirmation message with updated details
    """
    try:
        # Get the last reminder ID from context
        reminder_id = last_reminder_id.get()
        
        if not reminder_id:
            return "❌ No recent reminder found in this conversation. Please specify the reminder ID or create a reminder first."
        
        # Parse updates (same logic as update_reminder_from_chat)
        update_data = {}
        
        # Extract new title if mentioned
        if "title:" in updates.lower():
            title_match = re.search(r'title:\s*([^\n,]+)', updates, re.IGNORECASE)
            if title_match:
                update_data["title"] = title_match.group(1).strip()
        
        # Extract new description if mentioned
        if "description:" in updates.lower() or "details:" in updates.lower():
            desc_match = re.search(r'(?:description|details):\s*([^\n]+)', updates, re.IGNORECASE)
            if desc_match:
                update_data["description"] = desc_match.group(1).strip()
        elif any(word in updates.lower() for word in ["add details", "add more details", "include", "details about"]):
            # Extract the details part
            details_match = re.search(r'(?:add details|details about|include|add more details)[\s:]*(.+)', updates, re.IGNORECASE)
            if details_match:
                update_data["description"] = details_match.group(1).strip()
        
        # Extract new due date if mentioned
        if any(word in updates.lower() for word in ["due", "when", "time", "date", "tomorrow", "today", "next", "change to", "make it"]):
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
        
        # Parse recurrence updates - enhanced to catch more patterns
        recurrence_keywords = [
            "every", "daily", "weekly", "monthly", "hourly", "minutely",
            "recurrence", "recurring", "repeat", "repeating",
            "each day", "each week", "each month", "each hour"
        ]
        
        if any(word in updates.lower() for word in recurrence_keywords):
            recurrence_data = parse_recurrence_from_text(updates)
            if recurrence_data["recurrence_type"] != RecurrenceType.NONE:
                update_data["recurrence_type"] = recurrence_data["recurrence_type"]
                update_data["recurrence_interval"] = recurrence_data["recurrence_interval"]
                if recurrence_data["recurrence_days_of_week"]:
                    update_data["recurrence_days_of_week"] = recurrence_data["recurrence_days_of_week"]
                if recurrence_data["recurrence_day_of_month"]:
                    update_data["recurrence_day_of_month"] = recurrence_data["recurrence_day_of_month"]
        
        # Check if user wants to remove recurrence
        if any(phrase in updates.lower() for phrase in ["remove recurrence", "stop repeating", "not recurring", "one time", "once only"]):
            update_data["recurrence_type"] = RecurrenceType.NONE
            update_data["recurrence_interval"] = 1
            update_data["recurrence_days_of_week"] = []
            update_data["recurrence_day_of_month"] = None
        
        if not update_data:
            return "❌ No valid updates found in the text. Please specify what you want to update."
        
        # Create update object
        reminder_update = ReminderUpdate(**update_data)
        
        # Update reminder
        updated_reminder = run_async(reminder_repository.update, reminder_id, reminder_update)
        
        if not updated_reminder:
            return f"❌ Reminder not found: {reminder_id}"
        
        # Keep this reminder as the last one
        last_reminder_id.set(reminder_id)
        
        # Format response with better recurrence display
        updates_text = []
        for field, value in update_data.items():
            if field == "due_date":
                updates_text.append(f"Due date: {value.strftime('%Y-%m-%d %H:%M UTC')}")
            elif field == "tags":
                updates_text.append(f"Tags: {', '.join(value)}")
            elif field == "recurrence_type":
                if value == RecurrenceType.NONE:
                    updates_text.append("Recurrence: Removed (one-time reminder)")
                else:
                    recurrence_text = f"Recurrence: {value}"
                    # Add details about days if weekly
                    if "recurrence_days_of_week" in update_data and update_data["recurrence_days_of_week"]:
                        days_map = {0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun"}
                        days_str = ", ".join([days_map.get(d, str(d)) for d in update_data["recurrence_days_of_week"]])
                        recurrence_text += f" on {days_str}"
                    updates_text.append(recurrence_text)
            elif field not in ["recurrence_interval", "recurrence_days_of_week", "recurrence_day_of_month"]:
                # Skip these as they're handled with recurrence_type
                updates_text.append(f"{field.replace('_', ' ').title()}: {value}")
        
        return f"""✏️ **Reminder updated successfully!**

**Title:** {updated_reminder.title}
**ID:** {reminder_id}
**Updates:**
{chr(10).join(['- ' + update for update in updates_text])}"""
        
    except Exception as e:
        print(f"❌ Error updating last reminder: {e}")
        import traceback
        traceback.print_exc()
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
        deleted = run_async(reminder_repository.delete, reminder_id)
        
        if not deleted:
            return f"❌ Reminder not found: {reminder_id}"
        
        return f"🗑️ **Reminder deleted successfully!**\nID: {reminder_id}"
        
    except Exception as e:
        print(f"❌ Error deleting reminder: {e}")
        import traceback
        traceback.print_exc()
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
        stats = run_async(reminder_repository.get_stats)
        
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
        update_last_reminder_from_chat,  # Add this before update_reminder_from_chat
        update_reminder_from_chat,
        delete_reminder_from_chat,
        get_reminder_stats_from_chat
    ]