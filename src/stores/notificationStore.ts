import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  loadNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load notifications', isLoading: false });
        return;
      }

      const notifications = data.notifications || [];
      const unreadCount = notifications.filter((n) => !n.read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to mark notification as read' });
        return;
      }

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to mark all notifications as read' });
        return;
      }

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  clearError: () => set({ error: null }),
}));
