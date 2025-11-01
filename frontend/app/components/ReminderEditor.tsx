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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            {reminder ? 'Edit Reminder' : 'Create New Reminder'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-500 ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
              placeholder="Enter reminder title..."
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-500 bg-white hover:border-gray-400 resize-none"
              placeholder="Optional description for your reminder..."
            />
          </div>

          {/* Due Date */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Due Date & Time *
            </label>
            <div className="space-y-4">
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 ${
                  errors.due_date ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              />
              
              {/* Quick Date Buttons */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 font-medium mr-2 flex items-center">Quick select:</span>
                {QUICK_DATES.map((quickDate) => (
                  <button
                    key={quickDate.label}
                    type="button"
                    onClick={() => handleQuickDate(quickDate.getValue)}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all duration-200 font-medium text-gray-700 border border-gray-200 hover:border-blue-300"
                  >
                    {quickDate.label}
                  </button>
                ))}
              </div>
            </div>
            {errors.due_date && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.due_date}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-3">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: option.value }))}
                  className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                    formData.priority === option.value
                      ? `${option.color} border-current shadow-lg transform scale-105`
                      : 'text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              <Repeat className="h-4 w-4 text-purple-600" />
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white hover:border-gray-400"
            >
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Recurrence Interval */}
            {formData.recurrence_type !== 'none' && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Repeat every
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.recurrence_interval}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      recurrence_interval: Number.parseInt(e.target.value) || 1 
                    }))}
                    className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white hover:border-gray-400"
                  />
                  <span className="text-sm text-gray-700 font-medium">
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
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Repeat on
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayOfWeekToggle(index)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                        formData.recurrence_days_of_week.includes(index)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-100 hover:border-blue-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {errors.recurrence_days_of_week && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.recurrence_days_of_week}</p>
                )}
              </div>
            )}

            {/* Day of Month for Monthly Recurrence */}
            {formData.recurrence_type === 'monthly' && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  On day of month
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.recurrence_day_of_month || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    recurrence_day_of_month: Number.parseInt(e.target.value) || undefined 
                  }))}
                  className={`w-24 px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white ${
                    errors.recurrence_day_of_month ? 'border-red-300' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Day"
                />
                {errors.recurrence_day_of_month && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.recurrence_day_of_month}</p>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              <Tag className="h-4 w-4 text-green-600" />
              Tags
            </label>
            <div className="space-y-4">
              <div className="flex gap-3">
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
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-500 bg-white hover:border-gray-400"
                  placeholder="Add a tag (press Enter)"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-2 rounded-lg text-sm bg-blue-100 text-blue-800 border border-blue-200 font-medium"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:text-blue-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors border-2 border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-3 px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
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