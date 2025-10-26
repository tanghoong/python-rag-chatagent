"""
Task Management Tool for LangChain Agent

Provides task management capabilities to the AI agent with natural language parsing.
"""

import asyncio
import re
from typing import List, Optional, Callable, Any
from concurrent.futures import ThreadPoolExecutor
from langchain_core.tools import tool
from database.task_repository import task_repository
from models.task_models import TaskCreate, TaskUpdate, TaskStatus, TaskPriority

# Thread pool for running async code
_executor = ThreadPoolExecutor(max_workers=1)


def run_async(async_func: Callable, *args, **kwargs) -> Any:
    """Helper to run async code in sync context using a separate thread"""
    def _run_in_thread():
        # Create new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            # Create a new task repository instance for this event loop
            from database.task_repository import TaskRepository
            repo = TaskRepository()
            
            # If the async_func is a method of task_repository, call it on the new instance
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


def parse_priority(text: str) -> TaskPriority:
    """
    Parse priority from natural language
    
    Args:
        text: Text containing priority information
        
    Returns:
        TaskPriority enum value
    """
    text_lower = text.lower()
    if any(word in text_lower for word in ["urgent", "asap", "critical", "immediately"]):
        return TaskPriority.URGENT
    elif any(word in text_lower for word in ["high", "important"]):
        return TaskPriority.HIGH
    elif any(word in text_lower for word in ["low", "minor"]):
        return TaskPriority.LOW
    else:
        return TaskPriority.MEDIUM


def parse_tags(text: str) -> List[str]:
    """
    Extract tags from text
    
    Args:
        text: Text containing potential tags
        
    Returns:
        List of tags
    """
    # Look for hashtags
    hashtags = re.findall(r'#(\w+)', text)
    
    # Look for "tags:" or "tag:" followed by comma-separated values
    tag_match = re.search(r'tags?:\s*([^\n]+)', text, re.IGNORECASE)
    if tag_match:
        tags_text = tag_match.group(1)
        additional_tags = [tag.strip() for tag in tags_text.split(',')]
        hashtags.extend(additional_tags)
    
    # Remove duplicates and clean
    return list(set([tag.strip().lower() for tag in hashtags if tag.strip()]))


@tool
def create_task_from_chat(task_description: str) -> str:
    """
    Create a new task from natural language description.
    
    Use this tool when the user wants to:
    - Create a task, todo, or reminder
    - Add something to their task list
    - Remember to do something later
    
    The tool will automatically parse:
    - Task title and description
    - Priority level (urgent, high, medium, low)
    - Tags (using #hashtags or "tags: tag1, tag2")
    
    Examples:
    - "Create a task to finish the report by Friday #work #urgent"
    - "Add a todo: Buy groceries milk, eggs, bread tags: shopping, personal"
    - "Remind me to call John tomorrow high priority"
    
    Args:
        task_description: Natural language description of the task
        
    Returns:
        Confirmation message with task ID
    """
    try:
        # Parse the description
        lines = task_description.strip().split('\n')
        title = lines[0].strip()[:500]  # First line as title
        description = '\n'.join(lines[1:]).strip() if len(lines) > 1 else None
        
        # Parse priority
        priority = parse_priority(task_description)
        
        # Parse tags
        tags = parse_tags(task_description)
        
        # Create task
        task_data = TaskCreate(
            title=title,
            description=description,
            status=TaskStatus.TODO,
            priority=priority,
            tags=tags
        )
        
        # Ensure indexes first
        run_async(task_repository.ensure_indexes)
        
        # Create in database (run async in sync context)
        task = run_async(task_repository.create, task_data)
        
        # Build response
        response = "✅ **Task created successfully!**\n\n"
        response += f"- **Title:** {task.title}\n"
        response += f"- **ID:** `{task.id}`\n"
        response += f"- **Status:** {task.status.value}\n"
        response += f"- **Priority:** {task.priority.value}\n"
        if task.tags:
            response += f"- **Tags:** {', '.join(task.tags)}\n"
        if task.description:
            response += f"\n**Description:**\n\n{task.description}\n"
        
        return response
        
    except Exception as e:
        print(f"❌ Error creating task: {e}")
        import traceback
        traceback.print_exc()
        return f"❌ Error creating task: {str(e)}"


@tool
def list_tasks_from_chat(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 10
) -> str:
    """
    List tasks with optional filters.
    
    Use this tool when the user wants to:
    - See their tasks, todos, or task list
    - Check pending tasks
    - View completed tasks
    - Search for specific tasks
    
    Args:
        status: Filter by status (todo, in-progress, completed, cancelled)
        priority: Filter by priority (low, medium, high, urgent)
        search: Search text in title or description
        limit: Maximum number of tasks to return (default: 10)
        
    Returns:
        Formatted list of tasks
    """
    try:
        # Parse status
        task_status = None
        if status:
            try:
                task_status = TaskStatus(status.lower().replace(" ", "-"))
            except ValueError:
                pass
        
        # Parse priority
        task_priority = None
        if priority:
            try:
                task_priority = TaskPriority(priority.lower())
            except ValueError:
                pass
        
        # Get tasks
        tasks, total = run_async(
            task_repository.list,
            page=1,
            page_size=limit,
            status=task_status,
            priority=task_priority,
            search=search
        )
        
        if not tasks:
            return "📋 No tasks found matching your criteria."
        
        # Format response
        response = f"📋 **Your Tasks** ({len(tasks)} of {total})\n\n"
        
        for i, task in enumerate(tasks, 1):
            status_emoji = {
                "todo": "⏳",
                "in-progress": "🔄",
                "completed": "✅",
                "cancelled": "❌"
            }.get(task.status.value, "📌")
            
            priority_emoji = {
                "urgent": "🔥",
                "high": "⚠️",
                "medium": "📌",
                "low": "🔽"
            }.get(task.priority.value, "📌")
            
            response += f"### {i}. {status_emoji} {priority_emoji} {task.title}\n\n"
            response += f"- **ID:** `{task.id}`\n"
            response += f"- **Status:** {task.status.value}\n"
            response += f"- **Priority:** {task.priority.value}\n"
            if task.tags:
                response += f"- **Tags:** {', '.join(task.tags)}\n"
            if task.description and len(task.description) <= 100:
                response += f"- **Description:** {task.description}\n"
            response += "\n"
        
        return response
        
    except Exception as e:
        return f"❌ Error listing tasks: {str(e)}"


@tool
def update_task_status_from_chat(task_id: str, new_status: str) -> str:
    """
    Update a task's status.
    
    Use this tool when the user wants to:
    - Mark a task as complete/completed/done
    - Start working on a task (in-progress)
    - Cancel a task
    - Change task status
    
    Args:
        task_id: The task ID (e.g., "task_abc123")
        new_status: New status (todo, in-progress, completed, cancelled)
        
    Returns:
        Confirmation message
    """
    try:
        # Parse status
        try:
            status = TaskStatus(new_status.lower().replace(" ", "-"))
        except ValueError:
            return f"❌ Invalid status: {new_status}. Must be one of: todo, in-progress, completed, cancelled"
        
        # Update status
        task = run_async(task_repository.update_status, task_id, status)
        
        if not task:
            return f"❌ Task not found: {task_id}"
        
        status_emoji = {
            "todo": "⏳",
            "in-progress": "🔄",
            "completed": "✅",
            "cancelled": "❌"
        }.get(task.status.value, "📌")
        
        return f"{status_emoji} **Task status updated!**\n\n**{task.title}**\n\n- **New Status:** {task.status.value}"
        
    except Exception as e:
        return f"❌ Error updating task status: {str(e)}"


@tool
def update_task_from_chat(
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[str] = None
) -> str:
    """
    Update task details.
    
    Use this tool when the user wants to:
    - Edit a task
    - Change task title, description, or priority
    - Add or update tags
    
    Args:
        task_id: The task ID
        title: New title (optional)
        description: New description (optional)
        priority: New priority (low, medium, high, urgent) (optional)
        tags: New tags as comma-separated string (optional)
        
    Returns:
        Confirmation message
    """
    try:
        # Build update data
        update_data = {}
        
        if title:
            update_data["title"] = title
        
        if description:
            update_data["description"] = description
        
        if priority:
            try:
                update_data["priority"] = TaskPriority(priority.lower())
            except ValueError:
                return f"❌ Invalid priority: {priority}. Must be one of: low, medium, high, urgent"
        
        if tags:
            update_data["tags"] = [tag.strip() for tag in tags.split(",")]
        
        if not update_data:
            return "❌ No fields to update. Please provide title, description, priority, or tags."
        
        # Update task
        task_update = TaskUpdate(**update_data)
        task = run_async(task_repository.update, task_id, task_update)
        
        if not task:
            return f"❌ Task not found: {task_id}"
        
        return f"✅ **Task updated successfully!**\n\n**{task.title}**\n\n- **Priority:** {task.priority.value}\n- **Tags:** {', '.join(task.tags) if task.tags else 'None'}"
        
    except Exception as e:
        return f"❌ Error updating task: {str(e)}"


@tool
def delete_task_from_chat(task_id: str) -> str:
    """
    Delete a task.
    
    Use this tool when the user wants to:
    - Delete a task
    - Remove a task from their list
    
    Args:
        task_id: The task ID to delete
        
    Returns:
        Confirmation message
    """
    try:
        deleted = run_async(task_repository.delete, task_id)
        
        if not deleted:
            return f"❌ Task not found: {task_id}"
        
        return f"🗑️ Task deleted successfully: {task_id}"
        
    except Exception as e:
        return f"❌ Error deleting task: {str(e)}"


@tool
def get_task_stats_from_chat() -> str:
    """
    Get task statistics and overview.
    
    Use this tool when the user wants to:
    - See task statistics
    - Get an overview of their tasks
    - Check how many tasks they have
    
    Returns:
        Task statistics summary
    """
    try:
        stats = run_async(task_repository.get_stats)
        
        response = "📊 **Task Statistics**\n\n"
        response += f"**Total Tasks:** {stats['total']}\n\n"
        
        response += "**By Status:**\n"
        response += f"  ⏳ Todo: {stats['todo']}\n"
        response += f"  🔄 In Progress: {stats['in_progress']}\n"
        response += f"  ✅ Completed: {stats['completed']}\n"
        response += f"  ❌ Cancelled: {stats['cancelled']}\n\n"
        
        response += "**By Priority:**\n"
        response += f"  🔥 Urgent: {stats['by_priority']['urgent']}\n"
        response += f"  ⚠️ High: {stats['by_priority']['high']}\n"
        response += f"  📌 Medium: {stats['by_priority']['medium']}\n"
        response += f"  🔽 Low: {stats['by_priority']['low']}\n\n"
        
        response += f"**Recent Activity:**\n"
        response += f"  ✅ Completed in last 7 days: {stats['recent_completed']}\n"
        
        return response
        
    except Exception as e:
        return f"❌ Error retrieving task statistics: {str(e)}"


# Helper function to get all task tools
def get_task_tools():
    """
    Get list of all task management tools
    
    Returns:
        List of task management tools
    """
    return [
        create_task_from_chat,
        list_tasks_from_chat,
        update_task_status_from_chat,
        update_task_from_chat,
        delete_task_from_chat,
        get_task_stats_from_chat
    ]
