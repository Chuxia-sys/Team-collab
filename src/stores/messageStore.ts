import { create } from 'zustand';
import type { Message } from '@/types';

interface MessageState {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  replyingTo: Message | null;
  editingMessage: Message | null;
  error: string | null;
}

interface MessageActions {
  loadMessages: (workspaceId: string, channelId: string) => Promise<void>;
  sendMessage: (workspaceId: string, channelId: string, content: string, parentId?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  togglePinMessage: (messageId: string, isPinned: boolean) => Promise<void>;
  setReplyingTo: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
  clearMessages: () => void;
  clearError: () => void;
}

export const useMessageStore = create<MessageState & MessageActions>((set) => ({
  messages: [],
  isLoading: false,
  hasMore: false,
  replyingTo: null,
  editingMessage: null,
  error: null,

  loadMessages: async (workspaceId: string, channelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/channels/${channelId}/messages`
      );
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load messages', isLoading: false });
        return;
      }

      set({
        messages: data.messages || [],
        hasMore: data.pagination?.hasMore ?? false,
        isLoading: false,
      });
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  sendMessage: async (workspaceId: string, channelId: string, content: string, parentId?: string) => {
    set({ error: null });
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/channels/${channelId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, parentId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to send message' });
        return;
      }

      const message = data.message;
      set((state) => {
        const newMessages = [...state.messages, message];
        // If this was a reply, update the parent's replyCount
        if (parentId) {
          return {
            messages: newMessages.map((m) =>
              m.id === parentId
                ? { ...m, replyCount: m.replyCount + 1 }
                : m
            ),
            replyingTo: null,
          };
        }
        return { messages: newMessages, replyingTo: null };
      });
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  editMessage: async (messageId: string, content: string) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to edit message' });
        return;
      }

      const updated = data.message;
      set((state) => ({
        messages: state.messages.map((m) => (m.id === messageId ? { ...m, ...updated, isEdited: true } : m)),
        editingMessage: null,
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  deleteMessage: async (messageId: string) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to delete message' });
        return;
      }

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: 'This message has been deleted' } : m
        ),
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  togglePinMessage: async (messageId: string, isPinned: boolean) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/messages/${messageId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned }),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to pin message' });
        return;
      }

      const updated = data.message;
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, isPinned: updated.isPinned } : m
        ),
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  setReplyingTo: (message: Message | null) => {
    set({ replyingTo: message });
  },

  setEditingMessage: (message: Message | null) => {
    set({ editingMessage: message });
  },

  clearMessages: () => {
    set({ messages: [], hasMore: false, replyingTo: null, editingMessage: null });
  },

  clearError: () => set({ error: null }),
}));
