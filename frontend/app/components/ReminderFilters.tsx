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
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
      {/* Header with Quick Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Filter className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 font-medium text-gray-700 border border-gray-300 hover:border-gray-400"
          >
            {isExpanded ? 'Simple' : 'Advanced'}
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="space-y-3 mb-6">
        <span className="text-sm font-semibold text-gray-800">Quick Filters</span>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleQuickFilter(filter.key)}
              className="px-4 py-3 text-sm bg-gray-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all duration-200 font-medium text-gray-700 border border-gray-200 hover:border-blue-300 text-center"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-6 pt-6 border-t-2 border-gray-100">
          {/* Search */}
          <div className="space-y-3">
            <label htmlFor="search-input" className="block text-sm font-semibold text-gray-800 mb-2">
              Search
            </label>
            <input
              id="search-input"
              type="text"
              value={tempFilters.search || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search in title or description..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-500 bg-white hover:border-gray-400"
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Status
            </span>
            <div className="grid grid-cols-2 gap-3">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTempFilters(prev => ({
                    ...prev,
                    status: prev.status === option.value ? undefined : option.value
                  }))}
                  className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                    tempFilters.status === option.value
                      ? `${option.color} border-current shadow-lg transform scale-105`
                      : 'text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="space-y-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Priority
            </span>
            <div className="grid grid-cols-2 gap-3">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTempFilters(prev => ({
                    ...prev,
                    priority: prev.priority === option.value ? undefined : option.value
                  }))}
                  className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                    tempFilters.priority === option.value
                      ? `${option.color} border-current shadow-lg transform scale-105`
                      : 'text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="space-y-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Tag className="h-4 w-4 text-purple-600" />
                Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                      tempFilters.tags?.includes(tag)
                        ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-lg transform scale-105'
                        : 'text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="due-after-input" className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Calendar className="h-4 w-4 text-blue-600" />
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white hover:border-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="due-before-input" className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Calendar className="h-4 w-4 text-blue-600" />
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white hover:border-gray-400"
              />
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={handleApplyFilters}
              className="px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
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