/**
 * Custom hook for Reminder CRUD operations
 * 
 * Provides functions for creating, reading, updating, and deleting reminders
 * through the backend API
 */

import { useState } from 'react';
import { API_BASE_URL } from '../config';

export type ReminderStatus = 'pending' | 'completed' | 'snoozed' | 'cancelled';
export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RecurrenceType = 'none' | 'minutely' | 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  due_date: string; // ISO string
  status: ReminderStatus;
  priority: ReminderPriority;
  tags: string[];
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_end_date?: string; // ISO string
  recurrence_count?: number;
  recurrence_days_of_week: number[];
  recurrence_day_of_month?: number;
  is_recurring: boolean;
  parent_reminder_id?: string;
  next_occurrence?: string; // ISO string
  occurrence_count: number;
  created_by: string;
  created_at: string; // ISO string
  updated_at: string; // ISO string
  completed_at?: string; // ISO string
  snooze_until?: string; // ISO string
}

export interface ReminderCreate {
  title: string;
  description?: string;
  due_date: string; // ISO string
  status?: ReminderStatus;
  priority?: ReminderPriority;
  tags?: string[];
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  recurrence_end_date?: string; // ISO string
  recurrence_count?: number;
  recurrence_days_of_week?: number[];
  recurrence_day_of_month?: number;
}

export interface ReminderUpdate {
  title?: string;
  description?: string;
  due_date?: string; // ISO string
  status?: ReminderStatus;
  priority?: ReminderPriority;
  tags?: string[];
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  recurrence_end_date?: string; // ISO string
  recurrence_count?: number;
  recurrence_days_of_week?: number[];
  recurrence_day_of_month?: number;
  snooze_until?: string; // ISO string
}

export interface ReminderListResponse {
  reminders: Reminder[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ReminderStats {
  total: number;
  pending: number;
  completed: number;
  snoozed: number;
  cancelled: number;
  overdue: number;
  due_today: number;
  due_this_week: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  recent_completed: number;
}

export function useReminderCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  /**
   * Refresh reminders list
   */
  const refreshReminders = async () => {
    const result = await listReminders({ page: 1, pageSize: 100 }); // Get first 100 reminders
    if (result) {
      setReminders(result.reminders);
    }
  };

  /**
   * Create a new reminder
   */
  const createReminder = async (reminderData: ReminderCreate): Promise<Reminder | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reminders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create reminder');
      }

      const reminder = await response.json();
      return reminder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error creating reminder:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * List reminders with pagination and filters
   */
  const listReminders = async (
    options: {
      page?: number;
      pageSize?: number;
      status?: ReminderStatus;
      priority?: ReminderPriority;
      tags?: string[];
      search?: string;
      dueBefore?: string;
      dueAfter?: string;
      overdueOnly?: boolean;
      pendingOnly?: boolean;
    } = {}
  ): Promise<ReminderListResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const {
        page = 1,
        pageSize = 20,
        status: reminderStatus,
        priority: reminderPriority,
        tags,
        search,
        dueBefore,
        dueAfter,
        overdueOnly = false,
        pendingOnly = false,
      } = options;

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        overdue_only: overdueOnly.toString(),
        pending_only: pendingOnly.toString(),
      });

      if (reminderStatus) params.append('status', reminderStatus);
      if (reminderPriority) params.append('priority', reminderPriority);
      if (tags && tags.length > 0) params.append('tags', tags.join(','));
      if (search) params.append('search', search);
      if (dueBefore) params.append('due_before', dueBefore);
      if (dueAfter) params.append('due_after', dueAfter);

      const response = await fetch(`${API_BASE_URL}/api/reminders/list?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to list reminders');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error listing reminders:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get pending reminders
   */
  const getPendingReminders = async (limit: number = 50): Promise<Reminder[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reminders/pending?limit=${limit}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get pending reminders');
      }

      const reminders = await response.json();
      return reminders;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error getting pending reminders:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a specific reminder by ID
   */
  const getReminder = async (reminderId: string): Promise<Reminder | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get reminder');
      }

      const reminder = await response.json();
      return reminder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error getting reminder:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update a reminder
   */
  const updateReminder = async (reminderId: string, reminderUpdate: ReminderUpdate): Promise<Reminder | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update reminder');
      }

      const reminder = await response.json();
      return reminder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error updating reminder:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a reminder
   */
  const deleteReminder = async (reminderId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete reminder');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error deleting reminder:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Bulk delete reminders
   */
  const bulkDeleteReminders = async (reminderIds: string[]): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reminders/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reminder_ids: reminderIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to bulk delete reminders');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error bulk deleting reminders:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Complete a reminder
   */
  const completeReminder = async (reminderId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}/complete`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete reminder');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error completing reminder:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Snooze a reminder
   */
  const snoozeReminder = async (id: string, minutes: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      
      const response = await fetch(`${API_BASE_URL}/api/reminders/${id}/snooze`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ snooze_until: snoozeUntil }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to snooze reminder');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error snoozing reminder:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get all reminder tags
   */
  const getReminderTags = async (): Promise<string[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reminders/tags/list`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get reminder tags');
      }

      const tags = await response.json();
      return tags;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error getting reminder tags:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get reminder statistics
   */
  const getReminderStats = async (): Promise<ReminderStats | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reminders/stats/summary`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get reminder stats');
      }

      const stats = await response.json();
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error getting reminder stats:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    reminders,
    refreshReminders,
    createReminder,
    listReminders,
    getPendingReminders,
    getReminder,
    updateReminder,
    deleteReminder,
    bulkDeleteReminders,
    completeReminder,
    snoozeReminder,
    getReminderTags,
    getReminderStats,
  };
}