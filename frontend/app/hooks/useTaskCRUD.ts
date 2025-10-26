/**
 * Custom hook for Task CRUD operations
 * 
 * Provides functions for creating, reading, updating, and deleting tasks
 * through the backend API
 */

import { useState } from 'react';
import { API_BASE_URL } from '../config';

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  recent_completed: number;
}

export function useTaskCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new task
   */
  const createTask = async (taskData: TaskCreate): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create task');
      }

      const task = await response.json();
      return task;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error creating task:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * List tasks with pagination and filters
   */
  const listTasks = async (
    page: number = 1,
    pageSize: number = 50,
    status?: TaskStatus,
    priority?: TaskPriority,
    tags?: string[],
    search?: string
  ): Promise<TaskListResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (tags && tags.length > 0) params.append('tags', tags.join(','));
      if (search) params.append('search', search);

      const response = await fetch(`${API_BASE_URL}/api/tasks/list?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to list tasks');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error listing tasks:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a specific task by ID
   */
  const getTask = async (taskId: string): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get task');
      }

      const task = await response.json();
      return task;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error getting task:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update a task
   */
  const updateTask = async (
    taskId: string,
    taskUpdate: TaskUpdate
  ): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update task');
      }

      const task = await response.json();
      return task;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error updating task:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a task
   */
  const deleteTask = async (taskId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete task');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error deleting task:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Bulk delete tasks
   */
  const bulkDeleteTasks = async (taskIds: string[]): Promise<number> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_ids: taskIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to bulk delete tasks');
      }

      const data = await response.json();
      return data.deleted_count;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error bulk deleting tasks:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update task status
   */
  const updateTaskStatus = async (
    taskId: string,
    status: TaskStatus
  ): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update task status');
      }

      const task = await response.json();
      return task;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error updating task status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get all task tags
   */
  const getTaskTags = async (): Promise<string[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/tags/list`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get task tags');
      }

      const tags = await response.json();
      return tags;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error getting task tags:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get task statistics
   */
  const getTaskStats = async (): Promise<TaskStats | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/stats/summary`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get task stats');
      }

      const stats = await response.json();
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error getting task stats:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createTask,
    listTasks,
    getTask,
    updateTask,
    deleteTask,
    bulkDeleteTasks,
    updateTaskStatus,
    getTaskTags,
    getTaskStats,
  };
}
