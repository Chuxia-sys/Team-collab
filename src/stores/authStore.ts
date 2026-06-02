import { create } from 'zustand';
import type { User, AuthResponse, LoginCredentials, RegisterCredentials } from '@/types';
import { toast } from '@/hooks/use-toast';

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
  updateStatus: (status: 'online' | 'away' | 'busy' | 'offline') => Promise<void>;
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
        // No server session - check if Firebase has a persisted auth state
        try {
          const firebaseModule = await import('@/lib/firebase');
          if (firebaseModule.isFirebaseConfigured && firebaseModule.auth) {
            // Check for redirect-based sign-in result first
            try {
              const { getRedirectResult } = await import('firebase/auth');
              const redirectResult = await getRedirectResult(firebaseModule.auth);
              if (redirectResult?.user) {
                const idToken = await redirectResult.user.getIdToken();
                const redirectRes = await fetch('/api/auth/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    idToken,
                    email: redirectResult.user.email,
                    name: redirectResult.user.displayName,
                    photoURL: redirectResult.user.photoURL,
                  }),
                });
                if (redirectRes.ok) {
                  const redirectData: AuthResponse = await redirectRes.json();
                  set({ user: redirectData.user, initialized: true, isLoading: false });
                  const { useUIStore: uiStore2 } = await import('./uiStore');
                  if (uiState.currentView === 'login' || uiState.currentView === 'register' || uiState.currentView === 'landing') {
                    uiStore2.getState().navigate('dashboard');
                  }
                  toast({ title: 'Welcome!', description: `Signed in as ${redirectData.user.name}` });
                  return;
                }
              }
            } catch (redirectErr) {
              // Redirect result check failed, continue with normal flow
              console.warn('getRedirectResult check failed:', redirectErr);
            }

            const { onAuthStateChanged } = await import('firebase/auth');
            onAuthStateChanged(firebaseModule.auth, async (firebaseUser) => {
              if (firebaseUser) {
                try {
                  // Firebase user exists but no server session - re-establish session
                  const idToken = await firebaseUser.getIdToken();
                  const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      idToken,
                      email: firebaseUser.email,
                      name: firebaseUser.displayName,
                      photoURL: firebaseUser.photoURL,
                    }),
                  });
                  if (res.ok) {
                    const data: AuthResponse = await res.json();
                    set({ user: data.user, initialized: true, isLoading: false });
                    const { useUIStore } = await import('./uiStore');
                    const uiState = useUIStore.getState();
                    if (uiState.currentView === 'login' || uiState.currentView === 'register' || uiState.currentView === 'landing') {
                      useUIStore.getState().navigate('dashboard');
                    }
                    toast({ title: 'Welcome back!', description: `Signed in as ${data.user.name}` });
                    return;
                  }
                } catch {
                  // Failed to re-establish session
                }
              }
              // No Firebase user either - truly unauthenticated
              set({ user: null, initialized: true, isLoading: false });
            });
            return; // Don't set initialized yet - wait for onAuthStateChanged
          }
        } catch {
          // Firebase check failed, continue as unauthenticated
        }
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
      toast({ title: 'Welcome back!', description: `Signed in as ${data.user.name}` });
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
      toast({ title: 'Account created!', description: `Welcome to TeamCollab, ${data.user.name}!` });
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
        toast({ title: 'Google Sign-In unavailable', description: 'Firebase is not configured. Please add your Firebase credentials.', variant: 'destructive' });
        return;
      }

      // Dynamically import Firebase to avoid SSR issues
      const { auth, googleProvider } = await import('@/lib/firebase');
      const { signInWithPopup, signInWithRedirect } = await import('firebase/auth');

      try {
        // Try popup-based sign-in first
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

        // Try to parse JSON; if it fails (e.g. server returns HTML error page), show a clear message
        let data: any;
        try {
          data = await res.json();
        } catch {
          set({ error: 'Server error. Please try again or use email sign-in.', isGoogleLoading: false });
          toast({ title: 'Google Sign-In failed', description: 'The server returned an unexpected response. Please try again.', variant: 'destructive' });
          return;
        }

        if (!res.ok) {
          set({ error: data.error || 'Google sign-in failed. Please try again.', isGoogleLoading: false });
          toast({ title: 'Google Sign-In failed', description: data.error || 'Could not sign in with Google. Please try again.', variant: 'destructive' });
          return;
        }

        set({ user: data.user, isGoogleLoading: false, error: null });
        // Navigate to dashboard after successful Google sign-in
        const { useUIStore } = await import('./uiStore');
        useUIStore.getState().navigate('dashboard');
        toast({ title: 'Welcome back!', description: `Signed in as ${data.user.name}` });
      } catch (popupErr: unknown) {
        const popupError = popupErr as { code?: string };
        // If popup was blocked, fall back to redirect-based sign-in
        if (popupError.code === 'auth/popup-blocked') {
          toast({
            title: 'Popup blocked',
            description: 'Redirecting to Google sign-in...',
          });
          try {
            await signInWithRedirect(auth, googleProvider);
            // Page will redirect; result is handled on return via getRedirectResult
            return;
          } catch (redirectErr: unknown) {
            const redirectError = redirectErr as { code?: string; message?: string };
            console.error('Google sign-in redirect error:', redirectError);
            set({ error: redirectError.code === 'auth/operation-not-supported-in-this-environment'
              ? 'This browser does not support redirect sign-in. Please enable popups.'
              : 'Redirect sign-in failed. Please try again or use email sign-in.', isGoogleLoading: false });
            toast({ title: 'Redirect sign-in failed', description: redirectError.code === 'auth/operation-not-supported-in-this-environment'
              ? 'Please enable popups for this site and try again.'
              : redirectError.message || 'An unexpected error occurred.', variant: 'destructive' });
            return;
          }
        }
        throw popupErr; // Re-throw other popup errors to outer catch
      }
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      // Handle specific Firebase errors
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        set({ error: null, isGoogleLoading: false });
        return;
      }
      if (firebaseError.code === 'auth/popup-blocked') {
        set({ error: 'Popup was blocked by your browser. Please allow popups and try again, or use email sign-in.', isGoogleLoading: false });
        toast({ title: 'Popup blocked', description: 'Please allow popups in your browser settings and try again.', variant: 'destructive' });
        return;
      }
      if (firebaseError.code === 'auth/cancelled-popup-request') {
        set({ error: null, isGoogleLoading: false });
        return;
      }
      if (firebaseError.code === 'auth/network-request-failed') {
        set({ error: 'Network error. Please check your connection and try again.', isGoogleLoading: false });
        toast({ title: 'Network error', description: 'Please check your connection and try again.', variant: 'destructive' });
        return;
      }
      // Generic fallback with the actual error for debugging
      const errorMessage = firebaseError.message || 'An unexpected error occurred. Please try again.';
      set({ error: `Google sign-in failed: ${errorMessage}`, isGoogleLoading: false });
      toast({ title: 'Google Sign-In failed', description: errorMessage, variant: 'destructive' });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Sign out from Firebase if it was initialized
      try {
        const firebaseModule = await import('@/lib/firebase');
        if (firebaseModule.auth) {
          const { signOut } = await import('firebase/auth');
          await signOut(firebaseModule.auth);
        }
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
    toast({ title: 'Signed out', description: 'You have been successfully signed out.' });
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

  updateStatus: async (status: 'online' | 'away' | 'busy' | 'offline') => {
    try {
      const res = await fetch('/api/auth/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to update status:', data.error);
        return;
      }

      set((state) => ({
        user: state.user ? { ...state.user, status } : null,
      }));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  },

  clearError: () => set({ error: null }),
}));
