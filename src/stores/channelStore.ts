import { create } from 'zustand';
import type {
  Channel,
  CreateChannelData,
  UpdateChannelData,
} from '@/types';

interface ChannelState {
  channels: Channel[];
  currentChannel: Channel | null;
  isLoading: boolean;
  error: string | null;
}

interface ChannelActions {
  loadChannels: (workspaceId: string) => Promise<void>;
  createChannel: (workspaceId: string, data: CreateChannelData) => Promise<(Channel & { _isExisting?: boolean }) | null>;
  updateChannel: (workspaceId: string, channelId: string, data: UpdateChannelData) => Promise<void>;
  deleteChannel: (workspaceId: string, channelId: string) => Promise<void>;
  setCurrentChannel: (channel: Channel | null) => void;
  clearError: () => void;
}

export const useChannelStore = create<ChannelState & ChannelActions>((set) => ({
  channels: [],
  currentChannel: null,
  isLoading: false,
  error: null,

  loadChannels: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/channels`);
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load channels', isLoading: false });
        return;
      }

      set({ channels: data.channels || [], isLoading: false });
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  createChannel: async (workspaceId: string, channelData: CreateChannelData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelData),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to create channel', isLoading: false });
        return null;
      }

      const channel = data.channel;

      if (data.isExisting) {
        // Channel already exists — just set it as current without duplicating in the list
        set({ currentChannel: channel, isLoading: false });
        return { ...channel, _isExisting: true };
      }

      // New channel — add to list (deduplicate by id just in case)
      set((state) => ({
        channels: state.channels.some((c) => c.id === channel.id)
          ? state.channels
          : [...state.channels, channel],
        currentChannel: channel,
        isLoading: false,
      }));

      return { ...channel, _isExisting: false };
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
      return null;
    }
  },

  updateChannel: async (workspaceId: string, channelId: string, channelData: UpdateChannelData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/channels/${channelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelData),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to update channel', isLoading: false });
        return;
      }

      const updated = data.channel;
      set((state) => ({
        channels: state.channels.map((c) => (c.id === channelId ? updated : c)),
        currentChannel: state.currentChannel?.id === channelId ? updated : state.currentChannel,
        isLoading: false,
      }));
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  deleteChannel: async (workspaceId: string, channelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/channels/${channelId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to delete channel', isLoading: false });
        return;
      }

      set((state) => ({
        channels: state.channels.filter((c) => c.id !== channelId),
        currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
        isLoading: false,
      }));
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  setCurrentChannel: (channel: Channel | null) => {
    set({ currentChannel: channel });
  },

  clearError: () => set({ error: null }),
}));
