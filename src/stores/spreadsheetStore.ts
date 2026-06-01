import { create } from 'zustand';
import type { Spreadsheet } from '@/types';

interface SpreadsheetState {
  spreadsheets: Spreadsheet[];
  currentSpreadsheet: Spreadsheet | null;
  isLoading: boolean;
  error: string | null;
}

interface SpreadsheetActions {
  loadSpreadsheets: (workspaceId: string) => Promise<void>;
  createSpreadsheet: (workspaceId: string, data?: { title?: string; columns?: string[]; rows?: string[][] }) => Promise<Spreadsheet | null>;
  getSpreadsheet: (workspaceId: string, sheetId: string) => Promise<Spreadsheet | null>;
  updateSpreadsheet: (workspaceId: string, sheetId: string, data: { title?: string; columns?: string[]; rows?: string[][] }) => Promise<void>;
  deleteSpreadsheet: (workspaceId: string, sheetId: string) => Promise<void>;
  setCurrentSpreadsheet: (spreadsheet: Spreadsheet | null) => void;
  clearError: () => void;
}

export const useSpreadsheetStore = create<SpreadsheetState & SpreadsheetActions>((set) => ({
  spreadsheets: [],
  currentSpreadsheet: null,
  isLoading: false,
  error: null,

  loadSpreadsheets: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/spreadsheets`);
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load spreadsheets', isLoading: false });
        return;
      }

      set({ spreadsheets: data.spreadsheets || [], isLoading: false });
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  createSpreadsheet: async (workspaceId: string, sheetData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/spreadsheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetData || {}),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to create spreadsheet', isLoading: false });
        return null;
      }

      const spreadsheet = data.spreadsheet;
      set((state) => ({
        spreadsheets: [...state.spreadsheets, spreadsheet],
        currentSpreadsheet: spreadsheet,
        isLoading: false,
      }));

      return spreadsheet;
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
      return null;
    }
  },

  getSpreadsheet: async (workspaceId: string, sheetId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/spreadsheets/${sheetId}`);
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load spreadsheet', isLoading: false });
        return null;
      }

      const spreadsheet = data.spreadsheet;
      set({ currentSpreadsheet: spreadsheet, isLoading: false });
      return spreadsheet;
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
      return null;
    }
  },

  updateSpreadsheet: async (workspaceId: string, sheetId: string, sheetData) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/spreadsheets/${sheetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetData),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to update spreadsheet' });
        return;
      }

      const updated = data.spreadsheet;
      set((state) => ({
        spreadsheets: state.spreadsheets.map((s) => (s.id === sheetId ? updated : s)),
        currentSpreadsheet: state.currentSpreadsheet?.id === sheetId ? updated : state.currentSpreadsheet,
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  deleteSpreadsheet: async (workspaceId: string, sheetId: string) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/spreadsheets/${sheetId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to delete spreadsheet' });
        return;
      }

      set((state) => ({
        spreadsheets: state.spreadsheets.filter((s) => s.id !== sheetId),
        currentSpreadsheet: state.currentSpreadsheet?.id === sheetId ? null : state.currentSpreadsheet,
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  setCurrentSpreadsheet: (spreadsheet: Spreadsheet | null) => {
    set({ currentSpreadsheet: spreadsheet });
  },

  clearError: () => set({ error: null }),
}));
