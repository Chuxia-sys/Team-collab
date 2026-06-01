import { create } from 'zustand';
import type { User, AuthResponse, LoginCredentials, RegisterCredentials } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data: AuthResponse = await res.json();
        set({ user: data.user, initialized: true, isLoading: false });
        // Update UI store to dashboard when user is found
        const { useUIStore } = await import('./uiStore');
        const uiState = useUIStore.getState();
        if (uiState.currentView === 'login' || uiState.currentView === 'register' || uiState.currentView === 'landing') {
          useUIStore.getState().navigate('dashboard');
        }
      } else {
        set({ user: null, initialized: true, isLoading: false });
      }
    } catch {
      set({ user: null, initialized: true, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password } satisfies LoginCredentials),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Login failed', isLoading: false });
        return;
      }

      set({ user: data.user, isLoading: false, error: null });
      // Navigate to dashboard after successful login
      const { useUIStore } = await import('./uiStore');
      useUIStore.getState().navigate('dashboard');
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name } satisfies RegisterCredentials),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Registration failed', isLoading: false });
        return;
      }

      set({ user: data.user, isLoading: false, error: null });
      // Navigate to dashboard after successful registration
      const { useUIStore } = await import('./uiStore');
      useUIStore.getState().navigate('dashboard');
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue with logout even if API call fails
    }
    set({ user: null, isLoading: false, error: null });
    // Navigate to landing after logout
    const { useUIStore } = await import('./uiStore');
    useUIStore.getState().navigate('landing');
  },

  clearError: () => set({ error: null }),
}));
