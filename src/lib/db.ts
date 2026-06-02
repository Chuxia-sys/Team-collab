/**
 * Database layer — now backed by Firebase Firestore.
 * This module re-exports the Firestore db interface so all existing
 * API routes that `import { db } from '@/lib/db'` continue to work.
 */
export { firestoreDb as db } from './firestore';