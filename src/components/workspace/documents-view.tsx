'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Clock,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/stores/uiStore';
import { useDocumentStore } from '@/stores/documentStore';
import { format } from 'date-fns';

export function DocumentsView() {
  const { currentWorkspaceId, navigate } = useUIStore();
  const { documents, isLoading, loadDocuments, createDocument } = useDocumentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadDocuments(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadDocuments]);

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDocument = async () => {
    if (!currentWorkspaceId) return;
    setIsCreating(true);
    try {
      const doc = await createDocument(currentWorkspaceId, {
        title: 'Untitled Document',
        content: '',
      });
      if (doc) {
        navigate('workspace', {
          workspaceId: currentWorkspaceId,
          subView: 'document-edit',
          documentId: doc.id,
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenDocument = (docId: string) => {
    if (!currentWorkspaceId) return;
    navigate('workspace', {
      workspaceId: currentWorkspaceId,
      subView: 'document-edit',
      documentId: docId,
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-xl font-bold">Documents</h2>
          <p className="text-sm text-muted-foreground">{documents.length} documents</p>
        </div>
        <Button onClick={handleCreateDocument} disabled={isCreating} className="gap-2">
          <Plus className="h-4 w-4" />
          New Document
        </Button>
      </div>

      {/* Search */}
      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Document Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="mb-3 h-5 w-3/4" />
                  <Skeleton className="mb-2 h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </p>
            <p className="text-sm mt-1">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first document to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocs.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                  onClick={() => handleOpenDocument(doc.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold truncate">{doc.title}</h3>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(doc.updatedAt), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            v{doc.version}
                          </div>
                        </div>
                        {doc.creator && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            by {doc.creator.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
