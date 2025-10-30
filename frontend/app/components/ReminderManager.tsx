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
      return 'text-green-700 border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400';
    }
    if (permission === 'denied') {
      return 'text-red-700 border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400';
    }
    return 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 bg-white';
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
    <div className={`bg-linear-to-br from-indigo-50 via-white to-purple-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="border-b-2 border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Reminder Manager</h1>
              </div>
              {stats && (
                <div className="flex items-center gap-6 text-sm">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium">{stats.total} total</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg font-medium">{stats.pending} pending</span>
                  {stats.overdue > 0 && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-medium animate-pulse">{stats.overdue} overdue</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex rounded-xl border-2 border-gray-300 bg-white shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-3 text-sm font-semibold transition-all duration-200 rounded-l-xl ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-3 text-sm font-semibold transition-all duration-200 border-l-2 border-gray-300 rounded-r-xl ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>
              
              {/* Stats Button */}
              {stats && (
                <button
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                  title="View Statistics"
                >
                  <BarChart3 className="h-4 w-4" />
                  Stats
                </button>
              )}
              
              {/* Notification Settings Button */}
              <button
                onClick={() => setNotificationSettingsOpen(true)}
                className={`flex items-center gap-3 px-4 py-3 text-sm border-2 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md ${getNotificationButtonStyle()}`}
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
                className="flex items-center gap-3 px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
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
        <div className="w-80 border-r-2 border-gray-200 bg-white/50 backdrop-blur-sm">
          <div className="p-6">
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