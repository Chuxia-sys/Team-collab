import { create } from 'zustand';
import type { Task, CreateTaskData, UpdateTaskData } from '@/types';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

interface TaskActions {
  loadTasks: (workspaceId: string) => Promise<void>;
  createTask: (workspaceId: string, data: CreateTaskData) => Promise<Task | null>;
  updateTask: (workspaceId: string, taskId: string, data: UpdateTaskData) => Promise<void>;
  deleteTask: (workspaceId: string, taskId: string) => Promise<void>;
  reorderTasks: (workspaceId: string, tasks: Task[]) => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskState & TaskActions>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  loadTasks: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks`);
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load tasks', isLoading: false });
        return;
      }

      set({ tasks: data.tasks || [], isLoading: false });
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  createTask: async (workspaceId: string, taskData: CreateTaskData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to create task', isLoading: false });
        return null;
      }

      const task = data.task;
      set((state) => ({
        tasks: [...state.tasks, task],
        isLoading: false,
      }));

      return task;
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
      return null;
    }
  },

  updateTask: async (workspaceId: string, taskId: string, taskData: UpdateTaskData) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to update task' });
        return;
      }

      const updated = data.task;
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  deleteTask: async (workspaceId: string, taskId: string) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to delete task' });
        return;
      }

      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  reorderTasks: async (workspaceId: string, reorderedTasks: Task[]) => {
    // Optimistic update: immediately reorder in the UI
    set((state) => ({
      tasks: state.tasks.map((t) => {
        const reordered = reorderedTasks.find((r) => r.id === t.id);
        return reordered ? { ...t, order: reordered.order, status: reordered.status } : t;
      }),
    }));

    try {
      // Batch update order on the server
      const updates = reorderedTasks.map((t) => ({
        id: t.id,
        order: t.order,
        status: t.status,
      }));

      const res = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updates }),
      });

      if (!res.ok) {
        const data = await res.json();
        set({ error: data.error || 'Failed to reorder tasks' });
        // Could revert here if needed
      }
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  clearError: () => set({ error: null }),
}));
