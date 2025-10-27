/**
 * Custom hook for managing browser notifications
 * 
 * Provides functions for requesting permissions, sending notifications,
 * and managing notification settings for reminders
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  showInBackground: boolean;
  soundVolume: number;
  notificationTypes: {
    overdue: boolean;
    upcoming: boolean;
    recurrence: boolean;
  };
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: any;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  soundEnabled: true,
  showInBackground: true,
  soundVolume: 0.5,
  notificationTypes: {
    overdue: true,
    upcoming: true,
    recurrence: true,
  },
};

const STORAGE_KEY = 'reminder-notification-settings';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isSupported, setIsSupported] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeNotifications = useRef<Map<string, Notification>>(new Map());

  // Check if notifications are supported
  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      }
    }
  }, []);

  // Initialize audio element for sound alerts
  useEffect(() => {
    // Create a simple notification sound using Web Audio API
    const createNotificationSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(settings.soundVolume, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    };
    
    if (settings.soundEnabled && isSupported) {
      audioRef.current = {
        play: createNotificationSound
      } as any;
    }
  }, [settings.soundEnabled, settings.soundVolume, isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setSettings(prev => ({ ...prev, enabled: true }));
        return true;
      } else {
        setSettings(prev => ({ ...prev, enabled: false }));
        return false;
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Send a notification
  const sendNotification = useCallback(async (data: NotificationData): Promise<boolean> => {
    if (!isSupported || permission !== 'granted' || !settings.enabled) {
      return false;
    }

    try {
      // Play sound alert if enabled
      if (settings.soundEnabled && audioRef.current) {
        try {
          audioRef.current.play();
        } catch (soundError) {
          console.warn('Failed to play notification sound:', soundError);
        }
      }

      // Create browser notification
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        tag: data.tag,
        requireInteraction: data.requireInteraction || false,
        data: data.data,
        silent: !settings.soundEnabled, // Use built-in sound if our custom sound fails
      });

      // Store reference for later cleanup
      if (data.tag) {
        // Close any existing notification with the same tag
        const existing = activeNotifications.current.get(data.tag);
        if (existing) {
          existing.close();
        }
        activeNotifications.current.set(data.tag, notification);
      }

      // Auto-close notification after 10 seconds (unless requireInteraction is true)
      if (!data.requireInteraction) {
        setTimeout(() => {
          notification.close();
          if (data.tag) {
            activeNotifications.current.delete(data.tag);
          }
        }, 10000);
      }

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (data.tag) {
          activeNotifications.current.delete(data.tag);
        }
        
        // Custom click handler from data
        if (data.data?.onClick) {
          data.data.onClick();
        }
      };

      // Handle notification close
      notification.onclose = () => {
        if (data.tag) {
          activeNotifications.current.delete(data.tag);
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }, [isSupported, permission, settings]);

  // Send reminder notification
  const sendReminderNotification = useCallback(async (
    reminder: {
      id: string;
      title: string;
      description?: string;
      due_date: string;
      priority: string;
    },
    type: 'overdue' | 'upcoming' | 'recurrence' = 'upcoming'
  ): Promise<boolean> => {
    if (!settings.notificationTypes[type]) {
      return false;
    }

    const isOverdue = type === 'overdue';
    const dueDate = new Date(reminder.due_date);
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const minutesUntilDue = Math.round(timeDiff / (1000 * 60));

    let title = '';
    let body = '';
    let requireInteraction = false;

    switch (type) {
      case 'overdue':
        title = '🚨 Overdue Reminder';
        body = `"${reminder.title}" was due ${Math.abs(minutesUntilDue)} minutes ago`;
        requireInteraction = true;
        break;
      case 'upcoming':
        title = '⏰ Upcoming Reminder';
        if (minutesUntilDue <= 0) {
          body = `"${reminder.title}" is due now!`;
          requireInteraction = true;
        } else if (minutesUntilDue <= 5) {
          body = `"${reminder.title}" is due in ${minutesUntilDue} minute${minutesUntilDue !== 1 ? 's' : ''}`;
        } else {
          body = `"${reminder.title}" is due soon`;
        }
        break;
      case 'recurrence':
        title = '🔄 Recurring Reminder';
        body = `"${reminder.title}" - Next occurrence`;
        break;
    }

    if (reminder.description && reminder.description.length > 0) {
      body += `\n${reminder.description.slice(0, 100)}${reminder.description.length > 100 ? '...' : ''}`;
    }

    return await sendNotification({
      title,
      body,
      tag: `reminder-${reminder.id}`,
      requireInteraction,
      data: {
        reminderId: reminder.id,
        type,
        onClick: () => {
          // Focus the app and potentially navigate to reminder
          window.focus();
          
          // Custom event that the app can listen to
          window.dispatchEvent(
            new CustomEvent('reminder-notification-click', {
              detail: { reminderId: reminder.id, type }
            })
          );
        }
      }
    });
  }, [settings.notificationTypes, sendNotification]);

  // Update notification settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
    
    // If notifications are being disabled, close all active notifications
    if (!updatedSettings.enabled) {
      activeNotifications.current.forEach(notification => {
        notification.close();
      });
      activeNotifications.current.clear();
    }
  }, [settings]);

  // Clear all active notifications
  const clearAllNotifications = useCallback(() => {
    activeNotifications.current.forEach(notification => {
      notification.close();
    });
    activeNotifications.current.clear();
  }, []);

  // Test notification
  const testNotification = useCallback(async (): Promise<boolean> => {
    return await sendNotification({
      title: '✅ Test Notification',
      body: 'Notifications are working correctly!',
      tag: 'test-notification',
    });
  }, [sendNotification]);

  return {
    // State
    permission,
    settings,
    isSupported,
    
    // Actions
    requestPermission,
    sendNotification,
    sendReminderNotification,
    updateSettings,
    clearAllNotifications,
    testNotification,
    
    // Computed values
    canSendNotifications: isSupported && permission === 'granted' && settings.enabled,
  };
}