import React, { useState, useEffect } from 'react';
import { useReminderCRUD } from '../hooks/useReminderCRUD';
import type { Reminder, ReminderCreate, ReminderUpdate } from '../hooks/useReminderCRUD';
import { useNotifications } from '../hooks/useNotifications';
import ReminderEditor from './ReminderEditor';
import ReminderList from './ReminderList';
import ReminderFilters from './ReminderFilters';
import ReminderCard from './ReminderCard';
import NotificationSettings from './NotificationSettings';
import { Plus, BarChart3, List, Grid, Bell, BellOff, Settings } from 'lucide-react';

type ViewMode = 'list' | 'grid';
type SortField = 'due_date' | 'priority' | 'created_at' | 'status';
type SortOrder = 'asc' | 'desc';

interface ReminderManagerProps {
  className?: string;
}

export const ReminderManager: React.FC<ReminderManagerProps> = ({ className = '' }) => {
  const {
    loading,
    error,
    reminders,
    refreshReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    snoozeReminder,
    getReminderTags,
    getReminderStats,
  } = useReminderCRUD();

  const { canSendNotifications, permission } = useNotifications();

  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<any>({});

  // Notification settings state
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);

  // Helper functions for notification button styling
  const getNotificationButtonStyle = () => {
    if (canSendNotifications) {
      return 'text-green-700 border-green-300 bg-green-50 hover:bg-green-100';
    }
    if (permission === 'denied') {
      return 'text-red-700 border-red-300 bg-red-50 hover:bg-red-100';
    }
    return 'text-gray-700 border-gray-300 hover:bg-gray-50';
  };

  const getNotificationButtonTitle = () => {
    if (canSendNotifications) return 'Notifications enabled';
    if (permission === 'denied') return 'Notifications blocked';
    return 'Configure notifications';
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await refreshReminders();
      const tags = await getReminderTags();
      if (tags) setAvailableTags(tags);
      
      const statsData = await getReminderStats();
      if (statsData) setStats(statsData);
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Apply filters when reminders or filters change
  useEffect(() => {
    let filtered = [...reminders];
    
    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    
    if (filters.priority) {
      filtered = filtered.filter(r => r.priority === filters.priority);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(r => 
        filters.tags.some((tag: string) => r.tags.includes(tag))
      );
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        (r.description && r.description.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters.dueBefore) {
      filtered = filtered.filter(r => 
        new Date(r.due_date) <= new Date(filters.dueBefore)
      );
    }
    
    if (filters.dueAfter) {
      filtered = filtered.filter(r => 
        new Date(r.due_date) >= new Date(filters.dueAfter)
      );
    }
    
    if (filters.overdueOnly) {
      filtered = filtered.filter(r => 
        r.status === 'pending' && new Date(r.due_date) < new Date()
      );
    }
    
    if (filters.pendingOnly) {
      filtered = filtered.filter(r => r.status === 'pending');
    }
    
    setFilteredReminders(filtered);
  }, [reminders, filters]);

  const handleCreateReminder = () => {
    setEditingReminder(null);
    setEditorOpen(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setEditorOpen(true);
  };

  const handleSaveReminder = async (reminderData: ReminderCreate | ReminderUpdate) => {
    try {
      if (editingReminder) {
        await updateReminder(editingReminder.id, reminderData as ReminderUpdate);
      } else {
        await createReminder(reminderData as ReminderCreate);
      }
      
      await refreshReminders();
      
      // Refresh stats
      const statsData = await getReminderStats();
      if (statsData) setStats(statsData);
      
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  };

  const handleCompleteReminder = async (id: string) => {
    await completeReminder(id);
    await refreshReminders();
    
    // Refresh stats
    const statsData = await getReminderStats();
    if (statsData) setStats(statsData);
  };

  const handleSnoozeReminder = async (id: string, minutes: number) => {
    await snoozeReminder(id, minutes);
    await refreshReminders();
  };

  const handleDeleteReminder = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      await deleteReminder(id);
      await refreshReminders();
      
      // Refresh stats
      const statsData = await getReminderStats();
      if (statsData) setStats(statsData);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <div className={`bg-white min-h-screen ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Reminder Manager</h1>
              {stats && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{stats.total} total</span>
                  <span className="text-yellow-600">{stats.pending} pending</span>
                  {stats.overdue > 0 && (
                    <span className="text-red-600 font-medium">{stats.overdue} overdue</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex rounded-md border border-gray-300">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>
              
              {/* Stats Button */}
              {stats && (
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  title="View Statistics"
                >
                  <BarChart3 className="h-4 w-4" />
                  Stats
                </button>
              )}
              
              {/* Notification Settings Button */}
              <button
                onClick={() => setNotificationSettingsOpen(true)}
                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-md transition-colors ${getNotificationButtonStyle()}`}
                title={getNotificationButtonTitle()}
              >
                {canSendNotifications ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
                <Settings className="h-4 w-4" />
              </button>
              
              {/* Create Button */}
              <button
                onClick={handleCreateReminder}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Reminder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1">
        {/* Filters Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-gray-50">
          <div className="p-4">
            <ReminderFilters
              filters={filters}
              availableTags={availableTags}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            {viewMode === 'list' ? (
              <ReminderList
                reminders={filteredReminders}
                loading={loading}
                onEdit={handleEditReminder}
                onComplete={handleCompleteReminder}
                onSnooze={handleSnoozeReminder}
                onDelete={handleDeleteReminder}
                sortBy={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            ) : (
              /* Grid View - Simple grid layout */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading && (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                
                {!loading && filteredReminders.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">No reminders found</p>
                  </div>
                )}
                
                {!loading && filteredReminders.length > 0 && (
                  filteredReminders.map((reminder) => (
                    <div key={reminder.id} className="h-fit">
                      <ReminderCard
                        reminder={reminder}
                        onEdit={handleEditReminder}
                        onComplete={handleCompleteReminder}
                        onSnooze={handleSnoozeReminder}
                        onDelete={handleDeleteReminder}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      <ReminderEditor
        reminder={editingReminder}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveReminder}
      />

      {/* Notification Settings Modal */}
      <NotificationSettings
        isOpen={notificationSettingsOpen}
        onClose={() => setNotificationSettingsOpen(false)}
      />
    </div>
  );
};

export default ReminderManager;