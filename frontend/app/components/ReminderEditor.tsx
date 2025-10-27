import React, { useState, useEffect } from 'react';
import type { Reminder, ReminderCreate, ReminderUpdate, ReminderPriority, RecurrenceType } from '../hooks/useReminderCRUD';
import { X, Calendar, Tag, Repeat, Save, Plus } from 'lucide-react';
import { format, addDays, addHours } from 'date-fns';

interface ReminderEditorProps {
  reminder?: Reminder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminderData: ReminderCreate | ReminderUpdate) => Promise<void>;
}

const PRIORITY_OPTIONS: { value: ReminderPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-gray-600 bg-gray-100' },
  { value: 'medium', label: 'Medium', color: 'text-blue-600 bg-blue-100' },
  { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-100' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-100' },
];

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'No Repeat' },
  { value: 'minutely', label: 'Every Few Minutes' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const QUICK_DATES = [
  { label: 'In 1 Hour', getValue: () => addHours(new Date(), 1) },
  { label: 'Tomorrow 9 AM', getValue: () => {
    const tomorrow = addDays(new Date(), 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }},
  { label: 'This Evening', getValue: () => {
    const today = new Date();
    today.setHours(18, 0, 0, 0);
    return today;
  }},
  { label: 'Next Week', getValue: () => addDays(new Date(), 7) },
];

export const ReminderEditor: React.FC<ReminderEditorProps> = ({
  reminder,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as ReminderPriority,
    recurrence_type: 'none' as RecurrenceType,
    recurrence_interval: 1,
    recurrence_days_of_week: [] as number[],
    recurrence_day_of_month: undefined as number | undefined,
    tags: [] as string[],
  });
  
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when reminder changes
  useEffect(() => {
    if (reminder) {
      setFormData({
        title: reminder.title,
        description: reminder.description || '',
        due_date: reminder.due_date.slice(0, 16), // Format for datetime-local input
        priority: reminder.priority,
        recurrence_type: reminder.recurrence_type,
        recurrence_interval: reminder.recurrence_interval,
        recurrence_days_of_week: reminder.recurrence_days_of_week,
        recurrence_day_of_month: reminder.recurrence_day_of_month,
        tags: reminder.tags,
      });
    } else {
      // Default for new reminder
      const defaultDate = addHours(new Date(), 1);
      setFormData({
        title: '',
        description: '',
        due_date: format(defaultDate, "yyyy-MM-dd'T'HH:mm"),
        priority: 'medium',
        recurrence_type: 'none',
        recurrence_interval: 1,
        recurrence_days_of_week: [],
        recurrence_day_of_month: undefined,
        tags: [],
      });
    }
    setErrors({});
  }, [reminder]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    } else {
      const dueDate = new Date(formData.due_date);
      if (dueDate < new Date()) {
        newErrors.due_date = 'Due date cannot be in the past';
      }
    }
    
    if (formData.recurrence_type === 'weekly' && formData.recurrence_days_of_week.length === 0) {
      newErrors.recurrence_days_of_week = 'Please select at least one day for weekly recurrence';
    }
    
    if (formData.recurrence_type === 'monthly' && !formData.recurrence_day_of_month) {
      newErrors.recurrence_day_of_month = 'Please select a day of the month';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      const reminderData = {
        ...formData,
        due_date: new Date(formData.due_date).toISOString(),
      };
      
      await onSave(reminderData);
      onClose();
    } catch (error) {
      console.error('Error saving reminder:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleQuickDate = (getDate: () => Date) => {
    const date = getDate();
    setFormData(prev => ({
      ...prev,
      due_date: format(date, "yyyy-MM-dd'T'HH:mm")
    }));
  };

  const handleDayOfWeekToggle = (day: number) => {
    setFormData(prev => {
      const days = prev.recurrence_days_of_week.includes(day)
        ? prev.recurrence_days_of_week.filter(d => d !== day)
        : [...prev.recurrence_days_of_week, day].sort((a, b) => a - b);
      return { ...prev, recurrence_days_of_week: days };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {reminder ? 'Edit Reminder' : 'Create New Reminder'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter reminder title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Due Date & Time *
            </label>
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.due_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              
              {/* Quick Date Buttons */}
              <div className="flex flex-wrap gap-2">
                {QUICK_DATES.map((quickDate) => (
                  <button
                    key={quickDate.label}
                    type="button"
                    onClick={() => handleQuickDate(quickDate.getValue)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {quickDate.label}
                  </button>
                ))}
              </div>
            </div>
            {errors.due_date && (
              <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: option.value }))}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    formData.priority === option.value
                      ? option.color
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Repeat className="inline h-4 w-4 mr-1" />
              Recurrence
            </label>
            <select
              value={formData.recurrence_type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                recurrence_type: e.target.value as RecurrenceType,
                recurrence_days_of_week: [],
                recurrence_day_of_month: undefined
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Recurrence Interval */}
            {formData.recurrence_type !== 'none' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repeat every
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.recurrence_interval}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      recurrence_interval: parseInt(e.target.value) || 1 
                    }))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    {formData.recurrence_type === 'minutely' && 'minute(s)'}
                    {formData.recurrence_type === 'hourly' && 'hour(s)'}
                    {formData.recurrence_type === 'daily' && 'day(s)'}
                    {formData.recurrence_type === 'weekly' && 'week(s)'}
                    {formData.recurrence_type === 'monthly' && 'month(s)'}
                  </span>
                </div>
              </div>
            )}

            {/* Days of Week for Weekly Recurrence */}
            {formData.recurrence_type === 'weekly' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repeat on
                </label>
                <div className="flex gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayOfWeekToggle(index)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.recurrence_days_of_week.includes(index)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {errors.recurrence_days_of_week && (
                  <p className="mt-1 text-sm text-red-600">{errors.recurrence_days_of_week}</p>
                )}
              </div>
            )}

            {/* Day of Month for Monthly Recurrence */}
            {formData.recurrence_type === 'monthly' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  On day of month
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.recurrence_day_of_month || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    recurrence_day_of_month: parseInt(e.target.value) || undefined 
                  }))}
                  className={`w-20 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.recurrence_day_of_month ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Day"
                />
                {errors.recurrence_day_of_month && (
                  <p className="mt-1 text-sm text-red-600">{errors.recurrence_day_of_month}</p>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {(() => {
                if (saving) return 'Saving...';
                if (reminder) return 'Update Reminder';
                return 'Create Reminder';
              })()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderEditor;