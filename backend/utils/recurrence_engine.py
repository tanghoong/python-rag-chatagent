"""
Recurrence Engine Module

Background scheduler for handling recurring reminders and notifications.
"""

import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from database.reminder_repository import reminder_repository
from models.reminder_models import Reminder, ReminderStatus
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RecurrenceEngine:
    """
    Background scheduler for recurring reminders and notifications
    """
    
    def __init__(self):
        """Initialize the recurrence engine"""
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
    
    async def start(self):
        """Start the scheduler"""
        if not self.is_running:
            # Add recurring jobs
            self.scheduler.add_job(
                self._check_due_reminders,
                IntervalTrigger(minutes=1),  # Check every minute
                id="check_due_reminders",
                max_instances=1,
                replace_existing=True
            )
            
            self.scheduler.add_job(
                self._process_recurring_reminders,
                IntervalTrigger(hours=1),  # Process recurring every hour
                id="process_recurring_reminders",
                max_instances=1,
                replace_existing=True
            )
            
            self.scheduler.add_job(
                self._cleanup_old_reminders,
                CronTrigger(hour=2, minute=0),  # Run daily at 2 AM
                id="cleanup_old_reminders",
                max_instances=1,
                replace_existing=True
            )
            
            self.scheduler.start()
            self.is_running = True
            logger.info("🔔 Recurrence engine started")
    
    async def stop(self):
        """Stop the scheduler"""
        if self.is_running:
            self.scheduler.shutdown(wait=True)
            self.is_running = False
            logger.info("🔕 Recurrence engine stopped")
    
    async def _check_due_reminders(self):
        """
        Check for due reminders and update their status
        """
        try:
            # Get pending reminders that are due
            pending_reminders = await reminder_repository.get_pending_reminders()
            
            for reminder in pending_reminders:
                await self._handle_due_reminder(reminder)
                
        except Exception as e:
            logger.error(f"Error checking due reminders: {e}")
    
    async def _handle_due_reminder(self, reminder: Reminder):
        """
        Handle a due reminder (send notification, update status, etc.)
        
        Args:
            reminder: The due reminder
        """
        try:
            now = datetime.utcnow()
            
            # Check if reminder is due
            is_due = False
            
            if reminder.status == ReminderStatus.PENDING and reminder.due_date <= now:
                is_due = True
            elif reminder.status == ReminderStatus.SNOOZED and reminder.snooze_until and reminder.snooze_until <= now:
                is_due = True
                # Update status back to pending
                await reminder_repository.update_status(reminder.id, ReminderStatus.PENDING)
            
            if is_due:
                # Log the due reminder (in a real app, this would trigger notifications)
                logger.info(f"📅 Reminder due: {reminder.title} (ID: {reminder.id})")
                
                # Here you would implement actual notification logic:
                # - Browser notifications
                # - Email notifications
                # - Push notifications
                # - Sound alerts
                
                # For now, we'll just log it
                await self._send_notification(reminder)
                
        except Exception as e:
            logger.error(f"Error handling due reminder {reminder.id}: {e}")
    
    async def _send_notification(self, reminder: Reminder):
        """
        Send notification for a due reminder
        
        Args:
            reminder: The reminder to notify about
        """
        # This is where you would implement actual notification sending
        # For now, we'll just log it
        
        priority_emoji = {
            "low": "🔽",
            "medium": "📌", 
            "high": "⚠️",
            "urgent": "🔥"
        }
        
        emoji = priority_emoji.get(reminder.priority, "📌")
        
        notification_message = f"{emoji} {reminder.title}"
        if reminder.description:
            notification_message += f"\n{reminder.description}"
        
        logger.info(f"🔔 Notification: {notification_message}")
        
        # In a real implementation, you might:
        # - Store notifications in database for frontend to fetch
        # - Use WebSocket to push real-time notifications
        # - Send browser push notifications
        # - Play sound alerts
        # - Send email notifications
    
    async def _process_recurring_reminders(self):
        """
        Process recurring reminders and create new instances
        """
        try:
            # Find recurring reminders that need new instances
            now = datetime.utcnow()
            
            # Get all recurring reminders
            result = await reminder_repository.list(
                page=1,
                page_size=1000,  # Get all
                search=None
            )
            
            for reminder in result["reminders"]:
                if (reminder.is_recurring and 
                    reminder.next_occurrence and 
                    reminder.next_occurrence <= now):
                    
                    # Create new instance
                    new_instance = await reminder_repository.create_recurring_instance(reminder)
                    if new_instance:
                        logger.info(f"🔄 Created recurring instance: {new_instance.title} (Due: {new_instance.due_date})")
                    
        except Exception as e:
            logger.error(f"Error processing recurring reminders: {e}")
    
    async def _cleanup_old_reminders(self):
        """
        Clean up old completed reminders (optional maintenance)
        """
        try:
            # Remove completed reminders older than 30 days
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            
            # This is optional - you might want to keep all reminders
            # or implement a user preference for cleanup
            
            # For now, we'll just log the cleanup attempt
            logger.info(f"🧹 Cleanup check: Would remove completed reminders older than {cutoff_date}")
            
            # In a real implementation, you might:
            # - Delete old completed reminders
            # - Archive old reminders
            # - Compress old data
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    def add_scheduled_reminder(self, reminder: Reminder):
        """
        Add a specific reminder to the scheduler
        
        Args:
            reminder: Reminder to schedule
        """
        try:
            job_id = f"reminder_{reminder.id}"
            
            # Remove existing job if it exists
            if self.scheduler.get_job(job_id):
                self.scheduler.remove_job(job_id)
            
            # Add new job
            self.scheduler.add_job(
                self._handle_specific_reminder,
                trigger="date",
                run_date=reminder.due_date,
                args=[reminder.id],
                id=job_id,
                max_instances=1,
                replace_existing=True
            )
            
            logger.info(f"📅 Scheduled reminder: {reminder.title} for {reminder.due_date}")
            
        except Exception as e:
            logger.error(f"Error scheduling reminder {reminder.id}: {e}")
    
    async def _handle_specific_reminder(self, reminder_id: str):
        """
        Handle a specific scheduled reminder
        
        Args:
            reminder_id: ID of the reminder to handle
        """
        try:
            reminder = await reminder_repository.get_by_id(reminder_id)
            if reminder:
                await self._handle_due_reminder(reminder)
        except Exception as e:
            logger.error(f"Error handling specific reminder {reminder_id}: {e}")
    
    def remove_scheduled_reminder(self, reminder_id: str):
        """
        Remove a scheduled reminder from the scheduler
        
        Args:
            reminder_id: ID of the reminder to remove
        """
        try:
            job_id = f"reminder_{reminder_id}"
            if self.scheduler.get_job(job_id):
                self.scheduler.remove_job(job_id)
                logger.info(f"🗑️ Removed scheduled reminder: {reminder_id}")
        except Exception as e:
            logger.error(f"Error removing scheduled reminder {reminder_id}: {e}")


# Global recurrence engine instance
recurrence_engine = RecurrenceEngine()


# Helper functions for starting/stopping the engine
async def start_recurrence_engine():
    """Start the global recurrence engine"""
    await recurrence_engine.start()


async def stop_recurrence_engine():
    """Stop the global recurrence engine"""
    await recurrence_engine.stop()


# Utility functions for calculating recurrence
def calculate_next_due_date(
    current_date: datetime,
    recurrence_type: str,
    interval: int = 1,
    days_of_week: List[int] = None,
    day_of_month: int = None
) -> Optional[datetime]:
    """
    Calculate the next due date for a recurring reminder
    
    Args:
        current_date: Current due date
        recurrence_type: Type of recurrence (minutely, hourly, daily, weekly, monthly)
        interval: Recurrence interval
        days_of_week: Days of week for weekly recurrence (0=Monday)
        day_of_month: Day of month for monthly recurrence
    
    Returns:
        Next due date or None
    """
    try:
        if recurrence_type == "minutely":
            return current_date + timedelta(minutes=interval)
        
        elif recurrence_type == "hourly":
            return current_date + timedelta(hours=interval)
        
        elif recurrence_type == "daily":
            return current_date + timedelta(days=interval)
        
        elif recurrence_type == "weekly":
            if not days_of_week:
                # Default to same day of week
                return current_date + timedelta(weeks=interval)
            else:
                # Find next occurrence on specified days
                next_date = current_date + timedelta(days=1)
                while next_date.weekday() not in days_of_week:
                    next_date += timedelta(days=1)
                return next_date
        
        elif recurrence_type == "monthly":
            if day_of_month:
                # Use specific day of month
                next_month = current_date.month + interval
                next_year = current_date.year
                while next_month > 12:
                    next_month -= 12
                    next_year += 1
                
                try:
                    return current_date.replace(
                        year=next_year,
                        month=next_month,
                        day=day_of_month
                    )
                except ValueError:
                    # Handle cases like Feb 30 -> Feb 28
                    import calendar
                    last_day = calendar.monthrange(next_year, next_month)[1]
                    actual_day = min(day_of_month, last_day)
                    return current_date.replace(
                        year=next_year,
                        month=next_month,
                        day=actual_day
                    )
            else:
                # Use same day of month as current
                next_month = current_date.month + interval
                next_year = current_date.year
                while next_month > 12:
                    next_month -= 12
                    next_year += 1
                
                try:
                    return current_date.replace(year=next_year, month=next_month)
                except ValueError:
                    import calendar
                    last_day = calendar.monthrange(next_year, next_month)[1]
                    actual_day = min(current_date.day, last_day)
                    return current_date.replace(
                        year=next_year,
                        month=next_month,
                        day=actual_day
                    )
    
    except Exception as e:
        logger.error(f"Error calculating next due date: {e}")
        return None
    
    return None


def parse_natural_language_time(text: str) -> Optional[datetime]:
    """
    Parse natural language time expressions
    
    Args:
        text: Natural language time expression
    
    Returns:
        Parsed datetime or None
    """
    # This is a simplified parser - in production you might use libraries like:
    # - dateutil.parser
    # - parsedatetime
    # - dateparser
    
    import re
    from datetime import datetime, timedelta
    
    now = datetime.utcnow()
    text = text.lower().strip()
    
    # Handle "in X minutes/hours/days"
    if match := re.search(r'in (\d+) (minute|hour|day)s?', text):
        amount = int(match.group(1))
        unit = match.group(2)
        
        if unit == "minute":
            return now + timedelta(minutes=amount)
        elif unit == "hour":
            return now + timedelta(hours=amount)
        elif unit == "day":
            return now + timedelta(days=amount)
    
    # Handle "tomorrow"
    if "tomorrow" in text:
        tomorrow = now + timedelta(days=1)
        # Extract time if specified
        if match := re.search(r'(\d{1,2}):?(\d{2})?\s*(am|pm)?', text):
            hour = int(match.group(1))
            minute = int(match.group(2)) if match.group(2) else 0
            ampm = match.group(3)
            
            if ampm == "pm" and hour != 12:
                hour += 12
            elif ampm == "am" and hour == 12:
                hour = 0
            
            return tomorrow.replace(hour=hour, minute=minute, second=0, microsecond=0)
        else:
            return tomorrow.replace(hour=9, minute=0, second=0, microsecond=0)  # Default to 9 AM
    
    # Handle "next week"
    if "next week" in text:
        return now + timedelta(weeks=1)
    
    # Handle "next month"
    if "next month" in text:
        next_month = now.month + 1
        next_year = now.year
        if next_month > 12:
            next_month = 1
            next_year += 1
        return now.replace(year=next_year, month=next_month)
    
    # Handle specific times today
    if match := re.search(r'(\d{1,2}):?(\d{2})?\s*(am|pm)', text):
        hour = int(match.group(1))
        minute = int(match.group(2)) if match.group(2) else 0
        ampm = match.group(3)
        
        if ampm == "pm" and hour != 12:
            hour += 12
        elif ampm == "am" and hour == 12:
            hour = 0
        
        target_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        # If time has passed today, schedule for tomorrow
        if target_time <= now:
            target_time += timedelta(days=1)
        
        return target_time
    
    return None