import React from 'react';
import type { Reminder } from '../hooks/useReminderCRUD';
import { Check, Clock, X, Edit, Bell, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, isPast, format } from 'date-fns';

interface ReminderCardProps {
  reminder: Reminder;
  onComplete?: (id: string) => void;
  onSnooze?: (id: string, minutes: number) => void;
  onEdit?: (reminder: Reminder) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const priorityColors = {
  'low': 'text-gray-500 bg-gray-100',
  'medium': 'text-blue-600 bg-blue-100',
  'high': 'text-orange-600 bg-orange-100',
  'urgent': 'text-red-600 bg-red-100',
};

const statusColors = {
  'pending': 'text-yellow-600 bg-yellow-100',
  'completed': 'text-green-600 bg-green-100',
  'snoozed': 'text-purple-600 bg-purple-100',
  'cancelled': 'text-gray-600 bg-gray-100',
};

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onComplete,
  onSnooze,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const isOverdue = reminder.status === 'pending' && isPast(new Date(reminder.due_date));
  const isCompleted = reminder.status === 'completed';
  const isSnoozed = reminder.status === 'snoozed';

  // Helper functions to reduce complexity
  const getStatusIndicatorColor = () => {
    if (isOverdue) return 'bg-red-500';
    if (isCompleted) return 'bg-green-500'; 
    if (isSnoozed) return 'bg-purple-500';
    return 'bg-blue-500';
  };

  const getStatusIcon = () => {
    if (isCompleted) return <Check className="h-4 w-4 text-green-600" />;
    if (isOverdue) return <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />;
    if (isSnoozed) return <Clock className="h-4 w-4 text-purple-600" />;
    return <Bell className="h-4 w-4 text-blue-600" />;
  };

  const getTitleClasses = () => {
    if (isCompleted) return 'line-through text-gray-500';
    if (isOverdue) return 'text-red-700 font-semibold';
    return 'text-gray-900';
  };

  const cardClasses = `
    p-3 rounded-lg border transition-all duration-200 hover:shadow-md relative
    ${isCompleted ? 'bg-gray-50 opacity-75 border-gray-300' : 'bg-white shadow-sm'}
    ${isOverdue ? 'border-red-300 bg-red-50 ring-2 ring-red-200' : 'border-gray-200'}
    ${isSnoozed ? 'border-purple-300 bg-purple-50' : ''}
    ${reminder.status === 'pending' && !isOverdue ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200' : ''}
    ${compact ? 'p-2' : 'p-3'}
  `;

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24 && diffInHours > -24) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM dd, yyyy h:mm a');
  };

  const handleSnooze = (minutes: number) => {
    if (onSnooze) {
      onSnooze(reminder.id, minutes);
    }
  };

  return (
    <div className={cardClasses}>
      {/* Status indicator line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${getStatusIndicatorColor()}`} />
      
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title and Status */}
          <div className="flex items-center gap-2 mb-1">
            {/* Status icon */}
            <div className="shrink-0">
              {getStatusIcon()}
            </div>
            
            <h4 className={`font-medium text-sm truncate ${getTitleClasses()}`}>
              {reminder.title}
            </h4>
          </div>

          {/* Description */}
          {reminder.description && !compact && (
            <p className={`text-xs text-gray-600 mb-2 line-clamp-2 ${
              isCompleted ? 'line-through' : ''
            }`}>
              {reminder.description}
            </p>
          )}

          {/* Due Date */}
          <div className="flex items-center gap-1 mb-2">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className={`text-xs ${
              isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
            }`}>
              {formatDueDate(reminder.due_date)}
            </span>
          </div>

          {/* Priority and Status Badges */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              priorityColors[reminder.priority]
            }`}>
              {reminder.priority}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              statusColors[reminder.status]
            }`}>
              {reminder.status}
            </span>
          </div>

          {/* Tags */}
          {reminder.tags && reminder.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {reminder.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Recurrence Info */}
          {reminder.recurrence_type && reminder.recurrence_type !== 'none' && (
            <div className="flex items-center gap-1">
              <Bell className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                Repeats {reminder.recurrence_type}
                {reminder.recurrence_interval && reminder.recurrence_interval > 1 
                  ? ` every ${reminder.recurrence_interval}`
                  : ''
                }
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 ml-2">
          {/* Complete Button - Always show for pending reminders */}
          {reminder.status === 'pending' && onComplete && (
            <button
              onClick={() => onComplete(reminder.id)}
              className="p-1.5 hover:bg-green-100 rounded-md transition-all duration-200 hover:scale-110 group"
              title="Mark as complete"
            >
              <Check className="h-4 w-4 text-green-600 group-hover:text-green-700" />
            </button>
          )}
          
          {/* Snooze Button - Only for pending reminders */}
          {reminder.status === 'pending' && onSnooze && (
            <div className="relative group">
              <button
                className="p-1.5 hover:bg-purple-100 rounded-md transition-all duration-200 hover:scale-110"
                title="Snooze reminder"
              >
                <Clock className="h-4 w-4 text-purple-600 group-hover:text-purple-700" />
              </button>
              
              {/* Enhanced Snooze Dropdown */}
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100 animate-scale-in">
                <div className="py-2 min-w-36">
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b border-gray-100">
                    Snooze for:
                  </div>
                  {[
                    { label: '5 minutes', value: 5 },
                    { label: '15 minutes', value: 15 },
                    { label: '1 hour', value: 60 },
                    { label: '1 day', value: 1440 },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => handleSnooze(value)}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Edit Button */}
          {onEdit && (
            <button
              onClick={() => onEdit(reminder)}
              className="p-1.5 hover:bg-blue-100 rounded-md transition-all duration-200 hover:scale-110 group"
              title="Edit reminder"
            >
              <Edit className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
            </button>
          )}

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={() => onDelete(reminder.id)}
              className="p-1.5 hover:bg-red-100 rounded-md transition-all duration-200 hover:scale-110 group"
              title="Delete reminder"
            >
              <X className="h-4 w-4 text-red-600 group-hover:text-red-700" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReminderCard;