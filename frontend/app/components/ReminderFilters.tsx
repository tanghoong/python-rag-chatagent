import React, { useState } from 'react';
import type { ReminderStatus, ReminderPriority } from '../hooks/useReminderCRUD';
import { Filter, Calendar, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';

interface ReminderFiltersProps {
  filters: {
    status?: ReminderStatus;
    priority?: ReminderPriority;
    tags?: string[];
    search?: string;
    dueBefore?: string;
    dueAfter?: string;
    overdueOnly?: boolean;
    pendingOnly?: boolean;
  };
  availableTags: string[];
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

const STATUS_OPTIONS: { value: ReminderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-700 bg-yellow-100' },
  { value: 'completed', label: 'Completed', color: 'text-green-700 bg-green-100' },
  { value: 'snoozed', label: 'Snoozed', color: 'text-purple-700 bg-purple-100' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-gray-700 bg-gray-100' },
];

const PRIORITY_OPTIONS: { value: ReminderPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-gray-700 bg-gray-100' },
  { value: 'medium', label: 'Medium', color: 'text-blue-700 bg-blue-100' },
  { value: 'high', label: 'High', color: 'text-orange-700 bg-orange-100' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-700 bg-red-100' },
];

const QUICK_FILTERS = [
  { label: 'Today', key: 'today' },
  { label: 'This Week', key: 'thisWeek' },
  { label: 'Overdue', key: 'overdue' },
  { label: 'Pending Only', key: 'pendingOnly' },
];

export const ReminderFilters: React.FC<ReminderFiltersProps> = ({
  filters,
  availableTags,
  onFiltersChange,
  onClearFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== '';
  });

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsExpanded(false);
  };

  const handleQuickFilter = (filterKey: string) => {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    let newFilters = { ...filters };
    
    switch (filterKey) {
      case 'today':
        newFilters = {
          ...newFilters,
          dueAfter: startOfToday.toISOString(),
          dueBefore: endOfToday.toISOString(),
        };
        break;
      case 'thisWeek':
        newFilters = {
          ...newFilters,
          dueAfter: startOfWeek.toISOString(),
          dueBefore: endOfDay(endOfWeek).toISOString(),
        };
        break;
      case 'overdue':
        newFilters = {
          ...newFilters,
          overdueOnly: true,
          dueBefore: startOfToday.toISOString(),
        };
        break;
      case 'pendingOnly':
        newFilters = {
          ...newFilters,
          pendingOnly: true,
          status: 'pending',
        };
        break;
    }
    
    onFiltersChange(newFilters);
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = tempFilters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    setTempFilters(prev => ({ ...prev, tags: newTags }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header with Quick Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {isExpanded ? 'Simple' : 'Advanced'}
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => handleQuickFilter(filter.key)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={tempFilters.search || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search in title or description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              <CheckCircle className="inline h-4 w-4 mr-1" />
              Status
            </span>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTempFilters(prev => ({
                    ...prev,
                    status: prev.status === option.value ? undefined : option.value
                  }))}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    tempFilters.status === option.value
                      ? option.color
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              Priority
            </span>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTempFilters(prev => ({
                    ...prev,
                    priority: prev.priority === option.value ? undefined : option.value
                  }))}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    tempFilters.priority === option.value
                      ? option.color
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      tempFilters.tags?.includes(tag)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="due-after-input" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Due After
              </label>
              <input
                id="due-after-input"
                type="date"
                value={tempFilters.dueAfter ? format(new Date(tempFilters.dueAfter), 'yyyy-MM-dd') : ''}
                onChange={(e) => setTempFilters(prev => ({
                  ...prev,
                  dueAfter: e.target.value ? new Date(e.target.value).toISOString() : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="due-before-input" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Due Before
              </label>
              <input
                id="due-before-input"
                type="date"
                value={tempFilters.dueBefore ? format(new Date(tempFilters.dueBefore), 'yyyy-MM-dd') : ''}
                onChange={(e) => setTempFilters(prev => ({
                  ...prev,
                  dueBefore: e.target.value ? new Date(e.target.value).toISOString() : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderFilters;