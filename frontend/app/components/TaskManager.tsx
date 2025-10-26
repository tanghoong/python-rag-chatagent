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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📋 Task Manager</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your tasks and stay organized
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTask(null);
              setShowEditor(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">⏳ {stats.todo}</div>
              <div className="text-xs text-gray-600">Todo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">🔄 {stats.in_progress}</div>
              <div className="text-xs text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✅ {stats.completed}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">🔥 {stats.by_priority.urgent + stats.by_priority.high}</div>
              <div className="text-xs text-gray-600">High Priority</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />

          {/* Status Filter */}
          <select
            value={filterStatus || ''}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority || ''}
            onChange={(e) => setFilterPriority(e.target.value as TaskPriority || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Bulk Actions */}
          {selectedTasks.size > 0 && (
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🗑️ Delete Selected ({selectedTasks.size})
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading tasks...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">Error: {error}</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-lg font-medium">No tasks found</p>
            <p className="text-sm text-gray-500 mt-2">Create your first task to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Select All */}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={selectedTasks.size === tasks.length && tasks.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>

            {/* Tasks */}
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(task.id)}
                    onChange={() => toggleTaskSelection(task.id)}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <TaskStatusBadge status={task.status} />
                          <TaskPriorityBadge priority={task.priority} />
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {/* Status Quick Actions */}
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'completed')}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            title="Mark as completed"
                          >
                            ✅ Complete
                          </button>
                        )}
                        {task.status === 'todo' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'in-progress')}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            title="Start working"
                          >
                            🔄 Start
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setShowEditor(true);
                          }}
                          className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                          title="Edit task"
                        >
                          ✏️
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            setTaskToDelete(task.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                          title="Delete task"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      ID: {task.id} • Created: {new Date(task.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {tasks.length} of {total} tasks
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                Next →
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
              handleUpdateTask(editingTask.id, data);
            } else {
              handleCreateTask(data);
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
  task: Task | null;
  onSave: (data: TaskCreate | TaskUpdate) => void;
  onCancel: () => void;
  allTags: string[];
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter task title..."
                required
                maxLength={500}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter task description..."
                rows={4}
                maxLength={5000}
              />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="todo">⏳ Todo</option>
                  <option value="in-progress">🔄 In Progress</option>
                  <option value="completed">✅ Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  + Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-indigo-500 hover:text-indigo-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
