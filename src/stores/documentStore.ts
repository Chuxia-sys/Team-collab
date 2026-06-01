import { create } from 'zustand';
import type {
  Document,
  CreateDocumentData,
  UpdateDocumentData,
} from '@/types';

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  isLoading: boolean;
  error: string | null;
}

interface DocumentActions {
  loadDocuments: (workspaceId: string) => Promise<void>;
  createDocument: (workspaceId: string, data?: CreateDocumentData) => Promise<Document | null>;
  getDocument: (workspaceId: string, docId: string) => Promise<Document | null>;
  updateDocument: (workspaceId: string, docId: string, data: UpdateDocumentData) => Promise<void>;
  deleteDocument: (workspaceId: string, docId: string) => Promise<void>;
  setCurrentDocument: (doc: Document | null) => void;
  clearError: () => void;
}

export const useDocumentStore = create<DocumentState & DocumentActions>((set) => ({
  documents: [],
  currentDocument: null,
  isLoading: false,
  error: null,

  loadDocuments: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/documents`);
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load documents', isLoading: false });
        return;
      }

      set({ documents: data.documents || [], isLoading: false });
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  createDocument: async (workspaceId: string, docData?: CreateDocumentData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData || {}),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to create document', isLoading: false });
        return null;
      }

      const doc = data.document;
      set((state) => ({
        documents: [...state.documents, doc],
        currentDocument: doc,
        isLoading: false,
      }));

      return doc;
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
      return null;
    }
  },

  getDocument: async (workspaceId: string, docId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/documents/${docId}`);
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to load document', isLoading: false });
        return null;
      }

      const doc = data.document;
      set({ currentDocument: doc, isLoading: false });
      return doc;
    } catch {
      set({ error: 'Network error. Please try again.', isLoading: false });
      return null;
    }
  },

  updateDocument: async (workspaceId: string, docId: string, docData: UpdateDocumentData) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to update document' });
        return;
      }

      const updated = data.document;
      set((state) => ({
        documents: state.documents.map((d) => (d.id === docId ? updated : d)),
        currentDocument: state.currentDocument?.id === docId ? updated : state.currentDocument,
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  deleteDocument: async (workspaceId: string, docId: string) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/documents/${docId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Failed to delete document' });
        return;
      }

      set((state) => ({
        documents: state.documents.filter((d) => d.id !== docId),
        currentDocument: state.currentDocument?.id === docId ? null : state.currentDocument,
      }));
    } catch {
      set({ error: 'Network error. Please try again.' });
    }
  },

  setCurrentDocument: (doc: Document | null) => {
    set({ currentDocument: doc });
  },

  clearError: () => set({ error: null }),
}));
