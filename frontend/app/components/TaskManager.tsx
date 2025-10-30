/**
 * Task Manager Component
 * 
 * Complete task management interface with CRUD operations, filtering, and statistics
 */

import React, { useState, useEffect } from 'react';
import { useTaskCRUD, type Task, type TaskCreate, type TaskUpdate, type TaskStatus, type TaskPriority, type TaskStats } from '../hooks/useTaskCRUD';
import { TaskStatusBadge, TaskPriorityBadge } from './TaskStatusBadge';
import { ConfirmModal } from './ConfirmModal';

export function TaskManager() {
  const {
    loading,
    error,
    createTask,
    listTasks,
    updateTask,
    deleteTask,
    bulkDeleteTasks,
    updateTaskStatus,
    getTaskTags,
    getTaskStats,
  } = useTaskCRUD();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Filters
  const [filterStatus, setFilterStatus] = useState<TaskStatus | undefined>();
  const [filterPriority, setFilterPriority] = useState<TaskPriority | undefined>();
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI State
  const [showEditor, setShowEditor] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Load tasks
  const loadTasks = async () => {
    const result = await listTasks(page, pageSize, filterStatus, filterPriority, filterTags, searchQuery);
    if (result) {
      setTasks(result.tasks);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    }
  };

  // Load stats
  const loadStats = async () => {
    const result = await getTaskStats();
    if (result) {
      setStats(result);
    }
  };

  // Load tags
  const loadTags = async () => {
    const tags = await getTaskTags();
    setAllTags(tags);
  };

  useEffect(() => {
    loadTasks();
    loadStats();
    loadTags();
  }, [page, filterStatus, filterPriority, filterTags, searchQuery]);

  // Handlers
  const handleCreateTask = async (taskData: TaskCreate) => {
    const result = await createTask(taskData);
    if (result) {
      setShowEditor(false);
      loadTasks();
      loadStats();
      loadTags();
    }
  };

  const handleUpdateTask = async (taskId: string, taskUpdate: TaskUpdate) => {
    const result = await updateTask(taskId, taskUpdate);
    if (result) {
      setShowEditor(false);
      setEditingTask(null);
      loadTasks();
      loadStats();
      loadTags();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const success = await deleteTask(taskId);
    if (success) {
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
      loadTasks();
      loadStats();
    }
  };

  const handleBulkDelete = async () => {
    const taskIds = Array.from(selectedTasks);
    const deletedCount = await bulkDeleteTasks(taskIds);
    if (deletedCount > 0) {
      setSelectedTasks(new Set());
      setShowBulkDeleteConfirm(false);
      loadTasks();
      loadStats();
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const result = await updateTaskStatus(taskId, newStatus);
    if (result) {
      loadTasks();
      loadStats();
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(t => t.id)));
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">📋 Task Manager</h1>
            <p className="text-slate-600 text-lg">
              Organize your work and stay productive
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTask(null);
              setShowEditor(true);
            }}
            className="task-button px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/60 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center bg-white/50 rounded-2xl p-4 border border-slate-200/50 shadow-sm">
                <div className="text-3xl font-bold text-slate-900 mb-1">{stats.total}</div>
                <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Tasks</div>
              </div>
              <div className="text-center bg-white/50 rounded-2xl p-4 border border-slate-200/50 shadow-sm">
                <div className="text-3xl font-bold text-amber-600 mb-1 flex items-center justify-center gap-1">
                  <span>⏳</span> {stats.todo}
                </div>
                <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">To Do</div>
              </div>
              <div className="text-center bg-white/50 rounded-2xl p-4 border border-slate-200/50 shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-1 flex items-center justify-center gap-1">
                  <span>🔄</span> {stats.in_progress}
                </div>
                <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">In Progress</div>
              </div>
              <div className="text-center bg-white/50 rounded-2xl p-4 border border-slate-200/50 shadow-sm">
                <div className="text-3xl font-bold text-emerald-600 mb-1 flex items-center justify-center gap-1">
                  <span>✅</span> {stats.completed}
                </div>
                <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">Completed</div>
              </div>
              <div className="text-center bg-white/50 rounded-2xl p-4 border border-slate-200/50 shadow-sm">
                <div className="text-3xl font-bold text-orange-600 mb-1 flex items-center justify-center gap-1">
                  <span>🔥</span> {stats.by_priority.urgent + stats.by_priority.high}
                </div>
                <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">High Priority</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/60 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-lg">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input w-full pl-10 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-500 text-lg shadow-sm"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <select
                value={filterStatus || ''}
                onChange={(e) => setFilterStatus(e.target.value as TaskStatus || undefined)}
                className="px-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-slate-900 font-medium shadow-sm min-w-[140px]"
              >
                <option value="">All Statuses</option>
                <option value="todo">⏳ Todo</option>
                <option value="in-progress">🔄 In Progress</option>
                <option value="completed">✅ Completed</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority || ''}
                onChange={(e) => setFilterPriority(e.target.value as TaskPriority || undefined)}
                className="px-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-slate-900 font-medium shadow-sm min-w-[140px]"
              >
                <option value="">All Priorities</option>
                <option value="urgent">🔥 Urgent</option>
                <option value="high">⚠️ High</option>
                <option value="medium">📌 Medium</option>
                <option value="low">🔽 Low</option>
              </select>

              {/* Bulk Actions */}
              {selectedTasks.size > 0 && (
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span>🗑️</span>
                  <span>Delete Selected ({selectedTasks.size})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-6 py-6 task-list">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-slate-600 text-lg font-medium">Loading tasks...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-red-600 text-lg font-medium">Error loading tasks</p>
              <p className="text-slate-500 text-sm mt-2">{error}</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-6 opacity-50 animate-bounce-subtle">📋</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No tasks found</h3>
              <p className="text-slate-600 text-lg mb-8">Create your first task to get started and boost your productivity!</p>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowEditor(true);
                }}
                className="btn-primary task-button px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
              >
                ✨ Create Your First Task
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center gap-3 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTasks.size === tasks.length && tasks.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 focus:ring-2"
                  />
                  <span className="text-slate-700 font-medium">Select All ({tasks.length} tasks)</span>
                </label>
              </div>

              {/* Tasks Grid */}
              <div className="grid gap-4">
                {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="task-card bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 hover:shadow-xl hover:bg-white/90 transition-all duration-300 fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => toggleTaskSelection(task.id)}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 focus:ring-2"
                        />
                      </label>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <h3 className="text-xl font-semibold text-slate-900 leading-tight">{task.title}</h3>
                            {task.description && (
                              <p className="text-slate-600 text-base leading-relaxed line-clamp-3">{task.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3">
                              <TaskStatusBadge status={task.status} />
                              <TaskPriorityBadge priority={task.priority} />
                              {task.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full font-medium border border-slate-200"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            {/* Status Quick Actions */}
                            {task.status !== 'completed' && (
                              <button
                                onClick={() => handleStatusChange(task.id, 'completed')}
                                className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-medium border border-emerald-200 flex items-center gap-2"
                                title="Mark as completed"
                              >
                                <span>✅</span>
                                <span>Complete</span>
                              </button>
                            )}
                            {task.status === 'todo' && (
                              <button
                                onClick={() => handleStatusChange(task.id, 'in-progress')}
                                className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium border border-blue-200 flex items-center gap-2"
                                title="Start working"
                              >
                                <span>🔄</span>
                                <span>Start</span>
                              </button>
                            )}

                            <div className="flex gap-2">
                              {/* Edit */}
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setShowEditor(true);
                                }}
                                className="p-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200 hover:border-indigo-200"
                                title="Edit task"
                              >
                                <span className="text-lg">✏️</span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  setTaskToDelete(task.id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 hover:border-red-200"
                                title="Delete task"
                              >
                                <span className="text-lg">🗑️</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 text-sm text-slate-500 flex items-center justify-between">
                          <span>ID: {task.id}</span>
                          <span>Created: {new Date(task.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white/80 backdrop-blur-sm border-t border-slate-200/60 px-6 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-slate-600 font-medium">
              Showing <span className="font-semibold text-slate-900">{tasks.length}</span> of{' '}
              <span className="font-semibold text-slate-900">{total}</span> tasks
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all duration-200 font-medium shadow-sm flex items-center gap-2"
              >
                <span>←</span>
                <span>Previous</span>
              </button>
              <div className="flex items-center gap-1">
                <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-semibold border border-indigo-200">
                  {page}
                </span>
                <span className="text-slate-500 mx-2">of</span>
                <span className="text-slate-700 font-medium">{totalPages}</span>
              </div>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all duration-200 font-medium shadow-sm flex items-center gap-2"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Editor Modal */}
      {showEditor && (
        <TaskEditor
          task={editingTask}
          onSave={(data) => {
            if (editingTask) {
              handleUpdateTask(editingTask.id, data as TaskUpdate);
            } else {
              handleCreateTask(data as TaskCreate);
            }
          }}
          onCancel={() => {
            setShowEditor(false);
            setEditingTask(null);
          }}
          allTags={allTags}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && taskToDelete && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={() => handleDeleteTask(taskToDelete)}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setTaskToDelete(null);
          }}
          danger={true}
        />
      )}

      {/* Bulk Delete Confirmation */}
      {showBulkDeleteConfirm && (
        <ConfirmModal
          isOpen={showBulkDeleteConfirm}
          title="Delete Multiple Tasks"
          message={`Are you sure you want to delete ${selectedTasks.size} task(s)? This action cannot be undone.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteConfirm(false)}
          danger={true}
        />
      )}
    </div>
  );
}

/**
 * Task Editor Component (Create/Edit Modal)
 */
interface TaskEditorProps {
  readonly task: Task | null;
  readonly onSave: (data: TaskCreate | TaskUpdate) => void;
  readonly onCancel: () => void;
  readonly allTags: string[];
}

function TaskEditor({ task, onSave, onCancel, allTags }: TaskEditorProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      tags,
    };

    onSave(data);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto slide-up">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">
              {task ? '✏️ Edit Task' : '✨ Create New Task'}
            </h2>
            <p className="text-slate-600 mt-1">
              {task ? 'Update your task details' : 'Add a new task to your list'}
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="task-title" className="block text-sm font-semibold text-slate-700 mb-2">
                Task Title *
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-slate-900 text-lg"
                placeholder="Enter a descriptive task title..."
                required
                maxLength={500}
              />
              <p className="text-xs text-slate-500 mt-1">{title.length}/500 characters</p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="task-description" className="block text-sm font-semibold text-slate-700 mb-2">
                Description
              </label>
              <textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-slate-900 resize-none"
                placeholder="Provide additional details about the task..."
                rows={4}
                maxLength={5000}
              />
              <p className="text-xs text-slate-500 mt-1">{description.length}/5000 characters</p>
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="task-status" className="block text-sm font-semibold text-slate-700 mb-2">
                  Status
                </label>
                <select
                  id="task-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-slate-900 bg-white"
                >
                  <option value="todo">⏳ Todo</option>
                  <option value="in-progress">🔄 In Progress</option>
                  <option value="completed">✅ Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>

              <div>
                <label htmlFor="task-priority" className="block text-sm font-semibold text-slate-700 mb-2">
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-slate-900 bg-white"
                >
                  <option value="low">🔽 Low</option>
                  <option value="medium">📌 Medium</option>
                  <option value="high">⚠️ High</option>
                  <option value="urgent">🔥 Urgent</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="task-tags" className="block text-sm font-semibold text-slate-700 mb-2">
                Tags
              </label>
              <div className="flex gap-3 mb-3">
                <input
                  id="task-tags"
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-slate-900"
                  placeholder="Add a tag and press Enter..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                >
                  Add Tag
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium border border-indigo-200"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-indigo-500 hover:text-indigo-700 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {tags.length === 0 && (
                <p className="text-sm text-slate-500 mt-2">No tags added yet. Tags help organize your tasks.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-slate-200 flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
