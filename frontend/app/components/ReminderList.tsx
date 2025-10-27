import React from 'react';
import type { Reminder } from '../hooks/useReminderCRUD';
import ReminderCard from './ReminderCard';
import { Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { isToday, isTomorrow, isPast } from 'date-fns';

interface ReminderListProps {
  reminders: Reminder[];
  loading: boolean;
  onEdit: (reminder: Reminder) => void;
  onComplete: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onDelete: (id: string) => void;
  sortBy: 'due_date' | 'priority' | 'created_at' | 'status';
  sortOrder: 'asc' | 'desc';
  onSort: (field: 'due_date' | 'priority' | 'created_at' | 'status') => void;
}

const SORT_OPTIONS = [
  { value: 'due_date', label: 'Due Date', icon: Calendar },
  { value: 'priority', label: 'Priority', icon: AlertCircle },
  { value: 'created_at', label: 'Created', icon: Clock },
  { value: 'status', label: 'Status', icon: CheckCircle },
];

const PRIORITY_ORDER = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
const STATUS_ORDER = { 'pending': 1, 'snoozed': 2, 'completed': 3, 'cancelled': 4 };

export const ReminderList: React.FC<ReminderListProps> = ({
  reminders,
  loading,
  onEdit,
  onComplete,
  onSnooze,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}) => {
  // Sort reminders based on current sort settings
  const sortedReminders = React.useMemo(() => {
    return [...reminders].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'due_date':
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'priority':
          comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'status':
          comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [reminders, sortBy, sortOrder]);

  // Group reminders by status or date
  const groupedReminders = React.useMemo(() => {
    const groups: Record<string, Reminder[]> = {};
    
    sortedReminders.forEach(reminder => {
      let groupKey = '';
      
      if (reminder.status === 'completed' || reminder.status === 'cancelled') {
        groupKey = reminder.status === 'completed' ? 'Completed' : 'Cancelled';
      } else if (isPast(new Date(reminder.due_date))) {
        groupKey = 'Overdue';
      } else if (isToday(new Date(reminder.due_date))) {
        groupKey = 'Today';
      } else if (isTomorrow(new Date(reminder.due_date))) {
        groupKey = 'Tomorrow';
      } else {
        groupKey = 'Upcoming';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(reminder);
    });
    
    return groups;
  }, [sortedReminders]);

  const getGroupColor = (groupName: string) => {
    switch (groupName) {
      case 'Overdue':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'Today':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'Tomorrow':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'Cancelled':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getGroupOrder = (groupName: string) => {
    const order = {
      'Overdue': 1,
      'Today': 2,
      'Tomorrow': 3,
      'Upcoming': 4,
      'Completed': 5,
      'Cancelled': 6,
    };
    return order[groupName as keyof typeof order] || 7;
  };

  const sortedGroupNames = Object.keys(groupedReminders).sort(
    (a, b) => getGroupOrder(a) - getGroupOrder(b)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reminders found</h3>
        <p className="text-gray-500">Create your first reminder or adjust your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Sort by:</span>
        {SORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = sortBy === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => onSort(option.value as any)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
              {isActive && (
                <span className="text-xs">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grouped Reminders */}
      {sortedGroupNames.map((groupName) => {
        const groupReminders = groupedReminders[groupName];
        const groupColor = getGroupColor(groupName);
        
        return (
          <div key={groupName} className="space-y-3">
            {/* Group Header */}
            <div className={`flex items-center justify-between px-4 py-2 rounded-lg border ${groupColor}`}>
              <h3 className="font-medium">
                {groupName}
              </h3>
              <span className="text-sm font-medium">
                {groupReminders.length}
              </span>
            </div>
            
            {/* Group Reminders */}
            <div className="space-y-2">
              {groupReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onEdit={onEdit}
                  onComplete={onComplete}
                  onSnooze={onSnooze}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
      
      {/* Summary */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
        Showing {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default ReminderList;