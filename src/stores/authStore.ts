import { create } from 'zustand';
import type { User, AuthResponse, LoginCredentials, RegisterCredentials } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isGoogleLoading: boolean;
  error: string | null;
  initialized: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar?: string | null }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isLoading: false,
  isGoogleLoading: false,
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

  loginWithGoogle: async () => {
    set({ isGoogleLoading: true, error: null });
    try {
      // Check if Firebase is configured
      const { isFirebaseConfigured } = await import('@/lib/firebase');
      if (!isFirebaseConfigured) {
        set({ error: 'Google Sign-In is not configured. Please add Firebase credentials to your environment variables.', isGoogleLoading: false });
        return;
      }

      // Dynamically import Firebase to avoid SSR issues
      const { auth, googleProvider } = await import('@/lib/firebase');
      const { signInWithPopup } = await import('firebase/auth');

      const result = await signInWithPopup(auth, googleProvider);
      const credential = result.user;

      // Get ID token for server verification
      const idToken = await credential.getIdToken();

      // Send to our backend for verification and user creation/login
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          email: credential.email,
          name: credential.displayName,
          photoURL: credential.photoURL,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Google sign-in failed', isGoogleLoading: false });
        return;
      }

      set({ user: data.user, isGoogleLoading: false, error: null });
      // Navigate to dashboard after successful Google sign-in
      const { useUIStore } = await import('./uiStore');
      useUIStore.getState().navigate('dashboard');
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      // Handle specific Firebase errors
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        set({ error: null, isGoogleLoading: false });
        return;
      }
      if (firebaseError.code === 'auth/popup-blocked') {
        set({ error: 'Popup was blocked by your browser. Please allow popups and try again.', isGoogleLoading: false });
        return;
      }
      if (firebaseError.code === 'auth/cancelled-popup-request') {
        set({ error: null, isGoogleLoading: false });
        return;
      }
      if (firebaseError.code === 'auth/network-request-failed') {
        set({ error: 'Network error. Please check your connection and try again.', isGoogleLoading: false });
        return;
      }
      set({ error: 'Google sign-in failed. Please try again.', isGoogleLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Sign out from Firebase if it was initialized
      try {
        const { auth } = await import('@/lib/firebase');
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      } catch {
        // Firebase sign out failed, continue with local logout
      }
    } catch {
      // Continue with logout even if API call fails
    }
    set({ user: null, isLoading: false, error: null });
    // Navigate to landing after logout
    const { useUIStore } = await import('./uiStore');
    useUIStore.getState().navigate('landing');
  },

  updateProfile: async (data: { name?: string; avatar?: string | null }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        set({ error: responseData.error || 'Failed to update profile', isLoading: false });
        throw new Error(responseData.error || 'Failed to update profile');
      }

      set((state) => ({
        user: state.user ? { ...state.user, ...responseData.user } : null,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      if (err instanceof Error && err.message !== 'Failed to update profile') {
        set({ error: 'Network error. Please try again.', isLoading: false });
      }
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
