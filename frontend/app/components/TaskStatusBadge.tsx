/**
 * Task Status Badge Component
 * 
 * Visual status indicator for tasks
 */

import React from 'react';
import type { TaskStatus, TaskPriority } from '../hooks/useTaskCRUD';

interface TaskStatusBadgeProps {
  readonly status: TaskStatus;
  readonly className?: string;
}

export function TaskStatusBadge({ status, className = '' }: TaskStatusBadgeProps) {
  const statusConfig = {
    'todo': {
      label: 'Todo',
      emoji: '⏳',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200'
    },
    'in-progress': {
      label: 'In Progress',
      emoji: '🔄',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    'completed': {
      label: 'Completed',
      emoji: '✅',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200'
    },
    'cancelled': {
      label: 'Cancelled',
      emoji: '❌',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    }
  };

  const config = statusConfig[status];

  return (
    <span
      className={`status-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border shadow-sm ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <span className="text-base">{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Task Priority Badge Component
 */

interface TaskPriorityBadgeProps {
  readonly priority: TaskPriority;
  readonly className?: string;
}

export function TaskPriorityBadge({ priority, className = '' }: TaskPriorityBadgeProps) {
  const priorityConfig = {
    'low': {
      label: 'Low',
      emoji: '🔽',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-600'
    },
    'medium': {
      label: 'Medium',
      emoji: '📌',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    'high': {
      label: 'High',
      emoji: '⚠️',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    'urgent': {
      label: 'Urgent',
      emoji: '🔥',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    }
  };

  const config = priorityConfig[priority];

  return (
    <span
      className={`priority-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${config.bgColor} ${config.textColor} ${className}`}
    >
      <span className="text-base">{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
