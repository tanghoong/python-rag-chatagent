import React, { useState, useEffect } from 'react';
import { useReminderCRUD } from '../hooks/useReminderCRUD';
import type { Reminder } from '../hooks/useReminderCRUD';
import ReminderCard from './ReminderCard';
import { ChevronDown, ChevronRight, Plus, Bell } from 'lucide-react';
import { isToday, isPast, isTomorrow, isThisWeek } from 'date-fns';

interface ReminderSidebarProps {
  onCreateReminder?: () => void;
  onEditReminder?: (reminder: Reminder) => void;
  isVisible?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  priority?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  count,
  children,
  defaultOpen = true,
  priority = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2 rounded-md transition-all duration-200 ${
          priority ? 'bg-red-50 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="transform transition-transform duration-200">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </div>
          <span className={`text-sm font-medium transition-colors ${
            priority ? 'text-red-700' : 'text-gray-700'
          }`}>
            {title}
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full transition-all duration-200 ${
          priority ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ${
        isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="mt-2 space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ReminderSidebar: React.FC<ReminderSidebarProps> = ({
  onCreateReminder,
  onEditReminder,
  isVisible = true,
}) => {
  const {
    reminders,
    loading,
    completeReminder,
    snoozeReminder,
    deleteReminder,
    refreshReminders,
  } = useReminderCRUD();

  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Auto-refresh every minute to keep reminders up to date
  useEffect(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    const interval = setInterval(() => {
      refreshReminders();
    }, 60000); // Refresh every minute

    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [refreshReminders]);

  // Initial load
  useEffect(() => {
    refreshReminders();
  }, [refreshReminders]);

  // Categorize reminders
  const categorizeReminders = (reminders: Reminder[]) => {
    const overdue = reminders.filter(r => 
      r.status === 'pending' && isPast(new Date(r.due_date))
    );
    
    const today = reminders.filter(r => 
      r.status === 'pending' && 
      !isPast(new Date(r.due_date)) && 
      isToday(new Date(r.due_date))
    );
    
    const tomorrow = reminders.filter(r => 
      r.status === 'pending' && 
      isTomorrow(new Date(r.due_date))
    );
    
    const thisWeek = reminders.filter(r => 
      r.status === 'pending' && 
      !isToday(new Date(r.due_date)) && 
      !isTomorrow(new Date(r.due_date)) && 
      !isPast(new Date(r.due_date)) && 
      isThisWeek(new Date(r.due_date))
    );
    
    const later = reminders.filter(r => 
      r.status === 'pending' && 
      !isPast(new Date(r.due_date)) && 
      !isToday(new Date(r.due_date)) && 
      !isTomorrow(new Date(r.due_date)) && 
      !isThisWeek(new Date(r.due_date))
    );
    
    const completed = reminders.filter(r => 
      r.status === 'completed'
    ).slice(0, 5); // Show only recent 5 completed
    
    const snoozed = reminders.filter(r => 
      r.status === 'snoozed'
    );

    return { overdue, today, tomorrow, thisWeek, later, completed, snoozed };
  };

  const handleComplete = async (id: string) => {
    await completeReminder(id);
    refreshReminders();
  };

  const handleSnooze = async (id: string, minutes: number) => {
    await snoozeReminder(id, minutes);
    refreshReminders();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      await deleteReminder(id);
      refreshReminders();
    }
  };

  if (!isVisible) {
    return null;
  }

  const categories = categorizeReminders(reminders);

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Reminders</h2>
          </div>
          {onCreateReminder && (
            <button
              onClick={onCreateReminder}
              className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Create new reminder"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Quick Stats */}
        <div className="text-xs text-gray-500">
          {categories.overdue.length > 0 && (
            <span className="text-red-600 font-medium">
              {categories.overdue.length} overdue
            </span>
          )}
          {categories.overdue.length > 0 && (categories.today.length > 0 || categories.tomorrow.length > 0) && (
            <span className="mx-2">•</span>
          )}
          {categories.today.length > 0 && (
            <span>{categories.today.length} today</span>
          )}
          {categories.today.length > 0 && categories.tomorrow.length > 0 && (
            <span className="mx-2">•</span>
          )}
          {categories.tomorrow.length > 0 && (
            <span>{categories.tomorrow.length} tomorrow</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Overdue */}
            {categories.overdue.length > 0 && (
              <CollapsibleSection
                title="Overdue"
                count={categories.overdue.length}
                priority={true}
                defaultOpen={true}
              >
                {categories.overdue.map((reminder, index) => (
                  <div 
                    key={reminder.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onComplete={handleComplete}
                      onSnooze={handleSnooze}
                      onEdit={onEditReminder}
                      onDelete={handleDelete}
                      compact={true}
                    />
                  </div>
                ))}
              </CollapsibleSection>
            )}

            {/* Today */}
            {categories.today.length > 0 && (
              <CollapsibleSection
                title="Today"
                count={categories.today.length}
                defaultOpen={true}
              >
                {categories.today.map((reminder, index) => (
                  <div 
                    key={reminder.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onComplete={handleComplete}
                      onSnooze={handleSnooze}
                      onEdit={onEditReminder}
                      onDelete={handleDelete}
                      compact={true}
                    />
                  </div>
                ))}
              </CollapsibleSection>
            )}

            {/* Tomorrow */}
            {categories.tomorrow.length > 0 && (
              <CollapsibleSection
                title="Tomorrow"
                count={categories.tomorrow.length}
                defaultOpen={true}
              >
                {categories.tomorrow.map((reminder, index) => (
                  <div 
                    key={reminder.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onComplete={handleComplete}
                      onSnooze={handleSnooze}
                      onEdit={onEditReminder}
                      onDelete={handleDelete}
                      compact={true}
                    />
                  </div>
                ))}
              </CollapsibleSection>
            )}

            {/* This Week */}
            {categories.thisWeek.length > 0 && (
              <CollapsibleSection
                title="This Week"
                count={categories.thisWeek.length}
                defaultOpen={false}
              >
                {categories.thisWeek.map((reminder, index) => (
                  <div 
                    key={reminder.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onComplete={handleComplete}
                      onSnooze={handleSnooze}
                      onEdit={onEditReminder}
                      onDelete={handleDelete}
                      compact={true}
                    />
                  </div>
                ))}
              </CollapsibleSection>
            )}

            {/* Later */}
            {categories.later.length > 0 && (
              <CollapsibleSection
                title="Later"
                count={categories.later.length}
                defaultOpen={false}
              >
                {categories.later.map((reminder, index) => (
                  <div 
                    key={reminder.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onComplete={handleComplete}
                      onSnooze={handleSnooze}
                      onEdit={onEditReminder}
                      onDelete={handleDelete}
                      compact={true}
                    />
                  </div>
                ))}
              </CollapsibleSection>
            )}

            {/* Snoozed */}
            {categories.snoozed.length > 0 && (
              <CollapsibleSection
                title="Snoozed"
                count={categories.snoozed.length}
                defaultOpen={false}
              >
                {categories.snoozed.map((reminder, index) => (
                  <div 
                    key={reminder.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onComplete={handleComplete}
                      onSnooze={handleSnooze}
                      onEdit={onEditReminder}
                      onDelete={handleDelete}
                      compact={true}
                    />
                  </div>
                ))}
              </CollapsibleSection>
            )}

            {/* Recently Completed */}
            {categories.completed.length > 0 && (
              <CollapsibleSection
                title="Recently Completed"
                count={categories.completed.length}
                defaultOpen={false}
              >
                {categories.completed.map((reminder, index) => (
                  <div 
                    key={reminder.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onEdit={onEditReminder}
                      onDelete={handleDelete}
                      compact={true}
                    />
                  </div>
                ))}
              </CollapsibleSection>
            )}

            {/* Empty State */}
            {reminders.length === 0 && (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-2">No reminders yet</p>
                <p className="text-gray-400 text-xs">
                  Create your first reminder or ask the AI to set one up for you
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReminderSidebar;