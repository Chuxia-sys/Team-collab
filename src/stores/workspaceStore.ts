import { create } from 'zustand';
import type {
  Workspace,
  WorkspaceMember,
  CreateWorkspaceData,
  UpdateWorkspaceData,
  InviteMemberData,
  UpdateMemberRoleData,
} from '@/types';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  members: WorkspaceMember[];
  workspaceRoles: Record<string, string>;
  isLoading: boolean;
  error: string | null;
}

interface WorkspaceActions {
  loadWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace | null>;
  switchWorkspace: (id: string) => Promise<void>;
  updateWorkspace: (id: string, data: UpdateWorkspaceData) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  leaveWorkspace: (id: string) => Promise<void>;
  loadMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (workspaceId: string, email: string, role?: string) => Promise<void>;
  updateMemberRole: (workspaceId: string, userId: string, role: string) => Promise<void>;
  removeMember: (workspaceId: string, userId: string) => Promise<void>;
  joinWorkspace: (inviteCode: string) => Promise<Workspace | null>;
  generateInviteCode: (workspaceId: string) => Promise<string | null>;
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  members: [],
  workspaceRoles: {},
  isLoading: false,
  error: null,

  loadWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/workspaces');
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load workspaces', isLoading: false });
        return;
      }

      const workspaces = data.workspaces || [];
      set({ workspaces, isLoading: false });
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  createWorkspace: async (name: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description } satisfies CreateWorkspaceData),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to create workspace', isLoading: false });
        return null;
      }

      const workspace = data.workspace;
      set((state) => ({
        workspaces: [...state.workspaces, workspace],
        currentWorkspace: workspace,
        workspaceRoles: { ...state.workspaceRoles, [workspace.id]: 'owner' },
        isLoading: false,
      }));

      return workspace;
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
      return null;
    }
  },

  switchWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${id}`);
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load workspace', isLoading: false });
        return;
      }

      set({ currentWorkspace: data.workspace || null, isLoading: false });

      // Populate workspaceRoles from workspace.members if available
      const ws = data.workspace as any;
      if (ws?.members) {
        const roles: Record<string, string> = {};
        for (const m of ws.members) {
          roles[m.userId] = m.role;
        }
        set({ workspaceRoles: roles });
      }

      // Also load members when switching workspace
      get().loadMembers(id);
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  updateWorkspace: async (id: string, data: UpdateWorkspaceData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        set({ error: responseData.error || 'Failed to update workspace', isLoading: false });
        return;
      }

      const updated = responseData.workspace;
      set((state) => ({
        workspaces: state.workspaces.map((w) => (w.id === id ? updated : w)),
        currentWorkspace: state.currentWorkspace?.id === id ? updated : state.currentWorkspace,
        isLoading: false,
      }));
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  deleteWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to delete workspace', isLoading: false });
        return;
      }

      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
        currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        isLoading: false,
      }));
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  leaveWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${id}/leave`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to leave workspace', isLoading: false });
        return;
      }

      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
        currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        isLoading: false,
      }));
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  loadMembers: async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load members' });
        return;
      }

      const members = data.members || [];
      const roles: Record<string, string> = {};
      members.forEach((m) => {
        roles[m.userId] = m.role;
      });

      set({ members, workspaceRoles: roles });
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  inviteMember: async (workspaceId: string, email: string, role?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role } satisfies InviteMemberData),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to invite member', isLoading: false });
        return;
      }

      // The invitation was sent; the invited user must accept via notification
      set({ isLoading: false });
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  updateMemberRole: async (workspaceId: string, userId: string, role: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role } satisfies UpdateMemberRoleData),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to update member role', isLoading: false });
        return;
      }

      const updatedMember = data.member;
      set((state) => ({
        members: state.members.map((m) =>
          m.userId === userId ? updatedMember : m
        ),
        workspaceRoles: { ...state.workspaceRoles, [userId]: updatedMember.role },
        isLoading: false,
      }));
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  removeMember: async (workspaceId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to remove member', isLoading: false });
        return;
      }

      set((state) => {
        const newRoles = { ...state.workspaceRoles };
        delete newRoles[userId];
        return {
          members: state.members.filter((m) => m.userId !== userId),
          workspaceRoles: newRoles,
          isLoading: false,
        };
      });
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  joinWorkspace: async (inviteCode: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/workspaces/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to join workspace', isLoading: false });
        return null;
      }

      const workspace = data.workspace;
      set((state) => ({
        workspaces: [...state.workspaces, workspace],
        workspaceRoles: { ...state.workspaceRoles, [workspace.id]: 'member' },
        isLoading: false,
      }));

      return workspace;
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
      return null;
    }
  },

  generateInviteCode: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to generate invite code', isLoading: false });
        return null;
      }

      // Update the current workspace and the workspace in the workspaces list
      const newCode = data.inviteCode;
      set((state) => ({
        currentWorkspace: state.currentWorkspace
          ? { ...state.currentWorkspace, inviteCode: newCode }
          : null,
        workspaces: state.workspaces.map((w) =>
          w.id === workspaceId ? { ...w, inviteCode: newCode } : w
        ),
        isLoading: false,
      }));

      return newCode;
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
