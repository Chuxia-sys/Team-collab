import { create } from 'zustand';
import type { Presentation } from '@/types';

interface PresentationState {
  presentations: Presentation[];
  currentPresentation: Presentation | null;
  isLoading: boolean;
  error: string | null;
}

interface PresentationActions {
  loadPresentations: (workspaceId: string) => Promise<void>;
  createPresentation: (workspaceId: string, data?: { title?: string; slides?: Array<{ title: string; content: string }> }) => Promise<Presentation | null>;
  getPresentation: (workspaceId: string, presId: string) => Promise<Presentation | null>;
  updatePresentation: (workspaceId: string, presId: string, data: { title?: string; slides?: Array<{ title: string; content: string }> }) => Promise<void>;
  deletePresentation: (workspaceId: string, presId: string) => Promise<void>;
  setCurrentPresentation: (presentation: Presentation | null) => void;
  clearError: () => void;
}

export const usePresentationStore = create<PresentationState & PresentationActions>((set) => ({
  presentations: [],
  currentPresentation: null,
  isLoading: false,
  error: null,

  loadPresentations: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/presentations`);
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load presentations', isLoading: false });
        return;
      }

      set({ presentations: data.presentations || [], isLoading: false });
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  createPresentation: async (workspaceId: string, presData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/presentations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presData || {}),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to create presentation', isLoading: false });
        return null;
      }

      const presentation = data.presentation;
      set((state) => ({
        presentations: [...state.presentations, presentation],
        currentPresentation: presentation,
        isLoading: false,
      }));

      return presentation;
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
      return null;
    }
  },

  getPresentation: async (workspaceId: string, presId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/presentations/${presId}`);
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load presentation', isLoading: false });
        return null;
      }

      const presentation = data.presentation;
      set({ currentPresentation: presentation, isLoading: false });
      return presentation;
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
      return null;
    }
  },

  updatePresentation: async (workspaceId: string, presId: string, presData) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/presentations/${presId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presData),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to update presentation' });
        return;
      }

      const updated = data.presentation;
      set((state) => ({
        presentations: state.presentations.map((p) => (p.id === presId ? updated : p)),
        currentPresentation: state.currentPresentation?.id === presId ? updated : state.currentPresentation,
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  deletePresentation: async (workspaceId: string, presId: string) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/presentations/${presId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to delete presentation' });
        return;
      }

      set((state) => ({
        presentations: state.presentations.filter((p) => p.id !== presId),
        currentPresentation: state.currentPresentation?.id === presId ? null : state.currentPresentation,
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  setCurrentPresentation: (presentation: Presentation | null) => {
    set({ currentPresentation: presentation });
  },

  clearError: () => set({ error: null }),
}));
