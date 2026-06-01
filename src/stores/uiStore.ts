import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppView, WorkspaceSubView, NavigateParams } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  membersPanelOpen: boolean;
  currentView: AppView;
  currentWorkspaceId: string | null;
  currentChannelId: string | null;
  currentDocumentId: string | null;
  currentSpreadsheetId: string | null;
  currentPresentationId: string | null;
  currentTaskId: string | null;
  currentSubView: WorkspaceSubView;
  commandPaletteOpen: boolean;
  profileDialogOpen: boolean;
  keyboardShortcutsOpen: boolean;
  onboardingSeen: boolean;
}

interface UIActions {
  navigate: (view: AppView, params?: NavigateParams) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMembersPanel: () => void;
  setMembersPanelOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setProfileDialogOpen: (open: boolean) => void;
  setKeyboardShortcutsOpen: (open: boolean) => void;
  setOnboardingSeen: (seen: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      membersPanelOpen: false,
      currentView: 'landing',
      currentWorkspaceId: null,
      currentChannelId: null,
      currentDocumentId: null,
      currentSpreadsheetId: null,
      currentPresentationId: null,
      currentTaskId: null,
      currentSubView: 'home',
      commandPaletteOpen: false,
      profileDialogOpen: false,
      keyboardShortcutsOpen: false,
      onboardingSeen: false,

      navigate: (view: AppView, params?: NavigateParams) => {
        const updates: Partial<UIState> = { currentView: view };

        if (params) {
          if (params.workspaceId !== undefined) {
            updates.currentWorkspaceId = params.workspaceId;
          }
          if (params.channelId !== undefined) {
            updates.currentChannelId = params.channelId;
          }
          if (params.documentId !== undefined) {
            updates.currentDocumentId = params.documentId;
          }
          if (params.spreadsheetId !== undefined) {
            updates.currentSpreadsheetId = params.spreadsheetId;
          }
          if (params.presentationId !== undefined) {
            updates.currentPresentationId = params.presentationId;
          }
          if (params.taskId !== undefined) {
            updates.currentTaskId = params.taskId;
          }
          if (params.subView !== undefined) {
            updates.currentSubView = params.subView;
          }
        }

        // When navigating to workspace, set default subView if not specified
        if (view === 'workspace' && !params?.subView) {
          updates.currentSubView = 'home';
        }

        // When navigating away from workspace, clear workspace-specific IDs
        if (view !== 'workspace') {
          updates.currentChannelId = null;
          updates.currentDocumentId = null;
          updates.currentSpreadsheetId = null;
          updates.currentPresentationId = null;
          updates.currentTaskId = null;
          updates.currentSubView = 'home';
          updates.membersPanelOpen = false;
        }

        // When navigating to a non-workspace view, clear workspaceId
        if (view === 'landing' || view === 'login' || view === 'register') {
          updates.currentWorkspaceId = null;
        }

        set(updates);
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      toggleMembersPanel: () => {
        set((state) => ({ membersPanelOpen: !state.membersPanelOpen }));
      },

      setMembersPanelOpen: (open: boolean) => {
        set({ membersPanelOpen: open });
      },

      setCommandPaletteOpen: (open: boolean) => {
        set({ commandPaletteOpen: open });
      },

      setProfileDialogOpen: (open: boolean) => {
        set({ profileDialogOpen: open });
      },

      setKeyboardShortcutsOpen: (open: boolean) => {
        set({ keyboardShortcutsOpen: open });
      },

      setOnboardingSeen: (seen: boolean) => {
        set({ onboardingSeen: seen });
      },
    }),
    {
      name: 'team-collab-ui',
      // Only persist navigation state, not transient UI state
      partialize: (state) => ({
        currentView: state.currentView,
        currentWorkspaceId: state.currentWorkspaceId,
        currentChannelId: state.currentChannelId,
        currentDocumentId: state.currentDocumentId,
        currentSpreadsheetId: state.currentSpreadsheetId,
        currentPresentationId: state.currentPresentationId,
        currentTaskId: state.currentTaskId,
        currentSubView: state.currentSubView,
        sidebarOpen: state.sidebarOpen,
        onboardingSeen: state.onboardingSeen,
      }),
    }
  )
);
