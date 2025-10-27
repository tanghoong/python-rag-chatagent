import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useReminderCRUD } from '../hooks/useReminderCRUD';
import type { Reminder } from '../hooks/useReminderCRUD';
import { isPast, differenceInMinutes } from 'date-fns';

interface NotificationManagerProps {
  children: React.ReactNode;
}

/**
 * NotificationManager - Background component that monitors reminders
 * and sends notifications at appropriate times
 */
export const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const { sendReminderNotification, canSendNotifications, settings } = useNotifications();
  const { reminders, refreshReminders } = useReminderCRUD();
  const notifiedReminders = useRef<Set<string>>(new Set());
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  // Monitor reminders and send notifications
  const checkReminders = React.useCallback(() => {
    if (!canSendNotifications || !settings.enabled) {
      return;
    }

    const now = new Date();
    const pendingReminders = reminders.filter(r => r.status === 'pending');

    pendingReminders.forEach((reminder: Reminder) => {
      const dueDate = new Date(reminder.due_date);
      const minutesUntilDue = differenceInMinutes(dueDate, now);
      const notificationKey = `${reminder.id}-${Math.floor(now.getTime() / (5 * 60 * 1000))}`; // 5-minute buckets

      // Skip if already notified recently
      if (notifiedReminders.current.has(notificationKey)) {
        return;
      }

      let shouldNotify = false;
      let notificationType: 'overdue' | 'upcoming' | 'recurrence' = 'upcoming';

      // Check for overdue reminders
      if (isPast(dueDate) && settings.notificationTypes.overdue) {
        const minutesOverdue = Math.abs(minutesUntilDue);
        // Notify for overdue reminders every 15 minutes for the first hour, then every hour
        if (minutesOverdue <= 60) {
          shouldNotify = minutesOverdue % 15 === 0;
        } else {
          shouldNotify = minutesOverdue % 60 === 0;
        }
        notificationType = 'overdue';
      }
      // Check for upcoming reminders
      else if (settings.notificationTypes.upcoming) {
        // Notify at: 15 minutes, 5 minutes, 1 minute, and when due
        const standardTimes = [15, 5, 1, 0];
        const isStandardTime = standardTimes.includes(minutesUntilDue);
        const isHighPriorityEarly = minutesUntilDue === 30 && (reminder.priority === 'high' || reminder.priority === 'urgent');
        
        shouldNotify = isStandardTime || isHighPriorityEarly;
      }

      // Check for recurring reminders
      if (reminder.is_recurring && settings.notificationTypes.recurrence) {
        // Additional logic for recurring reminders could go here
        // For now, they follow the same pattern as regular reminders
      }

      if (shouldNotify) {
        notifiedReminders.current.add(notificationKey);
        sendReminderNotification(reminder, notificationType);
        
        // Clean up old notification keys (keep only last 24 hours worth)
        const cutoffTime = now.getTime() - (24 * 60 * 60 * 1000);
        notifiedReminders.current.forEach(key => {
          const [_, timestamp] = key.split('-');
          if (parseInt(timestamp) * 5 * 60 * 1000 < cutoffTime) {
            notifiedReminders.current.delete(key);
          }
        });
      }
    });
  }, [reminders, sendReminderNotification, canSendNotifications, settings]);

  // Set up periodic checking
  useEffect(() => {
    if (canSendNotifications && settings.enabled) {
      // Check immediately
      checkReminders();
      
      // Then check every minute
      checkInterval.current = setInterval(checkReminders, 60000);
    } else if (checkInterval.current) {
      clearInterval(checkInterval.current);
      checkInterval.current = null;
    }

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [checkReminders, canSendNotifications, settings.enabled]);

  // Refresh reminders periodically
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshReminders();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [refreshReminders]);

  // Listen for visibility changes to handle background notifications
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && canSendNotifications) {
        // App became visible, refresh reminders and check for notifications
        refreshReminders().then(() => {
          checkReminders();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshReminders, checkReminders, canSendNotifications]);

  // Listen for custom notification click events
  useEffect(() => {
    const handleNotificationClick = (event: CustomEvent) => {
      const { reminderId, type } = event.detail;
      
      // You can add custom logic here to handle notification clicks
      // For example, navigate to the reminder, show a modal, etc.
      console.log('Reminder notification clicked:', { reminderId, type });
      
      // Focus the app
      window.focus();
      
      // Refresh reminders to get latest state
      refreshReminders();
    };

    window.addEventListener('reminder-notification-click', handleNotificationClick as EventListener);
    return () => window.removeEventListener('reminder-notification-click', handleNotificationClick as EventListener);
  }, [refreshReminders]);

  // Handle page unload - clear intervals
  useEffect(() => {
    const handleUnload = () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return <>{children}</>;
};

export default NotificationManager;