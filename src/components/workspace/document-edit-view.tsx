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
  Bold,
  Italic,
  Heading1,
  List,
  Code,
  Quote,
  Heading2,
  ListOrdered,
  FileText,
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

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { icon: <Bold className="h-4 w-4" />, label: 'Bold', prefix: '**', suffix: '**' },
  { icon: <Italic className="h-4 w-4" />, label: 'Italic', prefix: '_', suffix: '_' },
  { icon: <Heading1 className="h-4 w-4" />, label: 'Heading 1', prefix: '# ', suffix: '', block: true },
  { icon: <Heading2 className="h-4 w-4" />, label: 'Heading 2', prefix: '## ', suffix: '', block: true },
  { icon: <List className="h-4 w-4" />, label: 'Bullet List', prefix: '- ', suffix: '', block: true },
  { icon: <ListOrdered className="h-4 w-4" />, label: 'Numbered List', prefix: '1. ', suffix: '', block: true },
  { icon: <Code className="h-4 w-4" />, label: 'Code', prefix: '`', suffix: '`' },
  { icon: <Quote className="h-4 w-4" />, label: 'Quote', prefix: '> ', suffix: '', block: true },
];

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (currentWorkspaceId && currentDocumentId) {
      getDocument(currentWorkspaceId, currentDocumentId);
    }
  }, [currentWorkspaceId, currentDocumentId, getDocument]);

  const [initializedDocId, setInitializedDocId] = useState<string | null>(null);
  if (currentDocument && currentDocument.id !== initializedDocId) {
    setInitializedDocId(currentDocument.id);
    setTitle(currentDocument.title);
    setContent(currentDocument.content);
    setLastSaved(new Date(currentDocument.updatedAt));
    if (currentDocument.title && currentDocument.content) setHasChanges(false);
  }

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

  const insertMarkdown = (button: ToolbarButton) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let insertPrefix = button.prefix;
    let insertSuffix = button.suffix;

    // For block elements, ensure we're on a new line
    if (button.block && start > 0 && content[start - 1] !== '\n') {
      insertPrefix = '\n' + insertPrefix;
    }

    const newContent =
      content.substring(0, start) +
      insertPrefix +
      (selectedText || 'text') +
      insertSuffix +
      content.substring(end);

    setContent(newContent);
    setHasChanges(true);

    // Set cursor position after the inserted text
    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = start + insertPrefix.length + (selectedText || 'text').length + insertSuffix.length;
      textarea.setSelectionRange(
        start + insertPrefix.length,
        newCursorPos
      );
    });
  };

  // Word and character counts
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

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
          <Button variant="ghost" size="icon" onClick={handleBack} className="hover:bg-primary/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="h-8 max-w-sm border-none text-lg font-semibold shadow-none focus-visible:ring-0"
              placeholder="Document title"
            />
          </div>
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

      {/* Markdown Toolbar */}
      <div className="flex items-center gap-0.5 border-b px-3 py-1.5 bg-muted/30">
        {TOOLBAR_BUTTONS.map((button, idx) => (
          <React.Fragment key={button.label}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background"
                    onClick={() => insertMarkdown(button)}
                  >
                    {button.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">{button.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {(idx === 1 || idx === 3 || idx === 5 || idx === 6) && (
              <Separator orientation="vertical" className="h-5 mx-1" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-3xl"
        >
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing... (Markdown supported)"
            className="min-h-[60vh] resize-none border-none shadow-none focus-visible:ring-0 text-base leading-relaxed p-0"
          />
        </motion.div>
      </div>

      {/* Footer - Word/Char count and Back link */}
      <div className="flex items-center justify-between border-t px-4 py-2 bg-muted/20">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Documents
        </button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <Separator orientation="vertical" className="h-3" />
          <span>{charCount} {charCount === 1 ? 'character' : 'characters'}</span>
          <Separator orientation="vertical" className="h-3" />
          <span className="text-muted-foreground/60">Markdown</span>
        </div>
      </div>
    </div>
  );
}
