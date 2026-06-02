import { create } from 'zustand';
import type { Notification, NotificationPagination } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  pagination: NotificationPagination | null;
  hasMore: boolean;
  isDropdownOpen: boolean;
}

interface NotificationActions {
  loadNotifications: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  acceptInvitation: (invitationId: string, notificationId: string) => Promise<boolean>;
  declineInvitation: (invitationId: string, notificationId: string) => Promise<boolean>;
  setDropdownOpen: (open: boolean) => void;
  addRealTimeNotification: (notification: Notification) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  pagination: null,
  hasMore: false,
  isDropdownOpen: false,
};

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  ...initialState,

  loadNotifications: async (page = 1) => {
    set({ isLoading: page === 1, isLoadingMore: page > 1, error: null });
    try {
      const limit = 20;
      const res = await fetch(`/api/notifications?page=${page}&limit=${limit}`);
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load notifications', isLoading: false, isLoadingMore: false });
        return;
      }

      const notifications = data.notifications || [];
      const pagination: NotificationPagination = data.pagination;
      const unreadCount = data.unreadCount || 0;
      const hasMore = pagination ? pagination.page < pagination.totalPages : false;

      set((state) => ({
        notifications: page === 1 ? notifications : [...state.notifications, ...notifications],
        unreadCount,
        pagination,
        hasMore,
        isLoading: false,
        isLoadingMore: false,
      }));
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false, isLoadingMore: false });
    }
  },

  loadMore: async () => {
    const { pagination, isLoadingMore } = get();
    if (isLoadingMore || !pagination) return;

    const nextPage = pagination.page + 1;
    if (nextPage > pagination.totalPages) return;

    await get().loadNotifications(nextPage);
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

  acceptInvitation: async (invitationId: string, notificationId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/notifications/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, notificationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to accept invitation' });
        return false;
      }

      // Remove the notification from the list
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));

      return true;
    } catch {
      set({ error: 'Network error. Please try again.' });
      return false;
    }
  },

  declineInvitation: async (invitationId: string, notificationId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/notifications/invitations/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, notificationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to decline invitation' });
        return false;
      }

      // Remove the notification from the list
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));

      return true;
    } catch {
      set({ error: 'Network error. Please try again.' });
      return false;
    }
  },

  setDropdownOpen: (open: boolean) => set({ isDropdownOpen: open }),

  addRealTimeNotification: (notification: Notification) => {
    set((state) => {
      // Avoid duplicates
      const exists = state.notifications.find((n) => n.id === notification.id);
      if (exists) return state;

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
      };
    });
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
