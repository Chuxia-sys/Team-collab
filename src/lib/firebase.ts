import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Firebase configuration - using environment variables for security
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

// Initialize Firebase (prevent re-initialization in development)
let app;
let auth;
let googleProvider;
let analytics;
let firestore: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);

    // Configure Google Auth Provider
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });

    // Initialize Analytics (client-side only)
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      import('firebase/analytics').then(({ getAnalytics }) => {
        analytics = getAnalytics(app);
      }).catch(() => {
        // Analytics not available
      });
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

// Get Firestore instance (works in both client and server)
export function getFirestoreApp(): Firestore {
  if (!firestore) {
    // Re-initialize if needed (for server-side)
    const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firestore = getFirestore(fbApp);
  }
  return firestore;
}

export { app, auth, googleProvider, analytics };
