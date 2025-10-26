/**
 * Task Status Badge Component
 * 
 * Visual status indicator for tasks
 */

import React from 'react';
import type { TaskStatus } from '../hooks/useTaskCRUD';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className = '' }: TaskStatusBadgeProps) {
  const statusConfig = {
    'todo': {
      label: 'Todo',
      emoji: '⏳',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300'
    },
    'in-progress': {
      label: 'In Progress',
      emoji: '🔄',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-300'
    },
    'completed': {
      label: 'Completed',
      emoji: '✅',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-300'
    },
    'cancelled': {
      label: 'Cancelled',
      emoji: '❌',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-300'
    }
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Task Priority Badge Component
 */

import type { TaskPriority } from '../hooks/useTaskCRUD';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function TaskPriorityBadge({ priority, className = '' }: TaskPriorityBadgeProps) {
  const priorityConfig = {
    'low': {
      label: 'Low',
      emoji: '🔽',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600'
    },
    'medium': {
      label: 'Medium',
      emoji: '📌',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700'
    },
    'high': {
      label: 'High',
      emoji: '⚠️',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700'
    },
    'urgent': {
      label: 'Urgent',
      emoji: '🔥',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700'
    }
  };

  const config = priorityConfig[priority];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
