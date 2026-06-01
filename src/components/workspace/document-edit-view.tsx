'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Download,
  Save,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUIStore } from '@/stores/uiStore';
import { useDocumentStore } from '@/stores/documentStore';
import { format } from 'date-fns';

export function DocumentEditView() {
  const { currentWorkspaceId, currentDocumentId, navigate } = useUIStore();
  const {
    currentDocument,
    isLoading,
    getDocument,
    updateDocument,
  } = useDocumentStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentWorkspaceId && currentDocumentId) {
      getDocument(currentWorkspaceId, currentDocumentId);
    }
  }, [currentWorkspaceId, currentDocumentId, getDocument]);

  useEffect(() => {
    if (currentDocument) {
      setTitle(currentDocument.title);
      setContent(currentDocument.content);
      setLastSaved(new Date(currentDocument.updatedAt));
      setHasChanges(false);
    }
  }, [currentDocument]);

  const saveDocument = useCallback(async () => {
    if (!currentWorkspaceId || !currentDocumentId || !hasChanges) return;
    setIsSaving(true);
    try {
      await updateDocument(currentWorkspaceId, currentDocumentId, { title, content });
      setLastSaved(new Date());
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [currentWorkspaceId, currentDocumentId, title, content, hasChanges, updateDocument]);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDocument();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, hasChanges, saveDocument]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasChanges(true);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(true);
  };

  const handleBack = () => {
    if (hasChanges) {
      saveDocument();
    }
    if (currentWorkspaceId) {
      navigate('workspace', {
        workspaceId: currentWorkspaceId,
        subView: 'documents',
      });
    }
  };

  if (isLoading && !currentDocument) {
    return (
      <div className="flex h-full flex-col p-6">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="h-8 max-w-sm border-none text-lg font-semibold shadow-none focus-visible:ring-0"
            placeholder="Document title"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Save indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : hasChanges ? (
              <>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                Unsaved changes
              </>
            ) : lastSaved ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                Saved {format(lastSaved, 'h:mm a')}
              </>
            ) : null}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={saveDocument} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save (auto-saves after 2s)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-3xl"
        >
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing... (Markdown supported)"
            className="min-h-[60vh] resize-none border-none shadow-none focus-visible:ring-0 text-base leading-relaxed"
          />
        </motion.div>
      </div>
    </div>
  );
}
