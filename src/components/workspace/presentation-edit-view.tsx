'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Download,
  Plus,
  Trash2,
  Check,
  Loader2,
  Save,
  ChevronUp,
  ChevronDown,
  Presentation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUIStore } from '@/stores/uiStore';
import { usePresentationStore } from '@/stores/presentationStore';
import { format } from 'date-fns';

interface Slide {
  title: string;
  content: string;
}

export function PresentationEditView() {
  const { currentWorkspaceId, currentPresentationId, navigate } = useUIStore();
  const {
    currentPresentation,
    isLoading,
    getPresentation,
    updatePresentation,
  } = usePresentationStore();

  const [title, setTitle] = useState('');
  const [slides, setSlides] = useState<Slide[]>([{ title: 'Slide 1', content: '' }]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentWorkspaceId && currentPresentationId) {
      getPresentation(currentWorkspaceId, currentPresentationId);
    }
  }, [currentWorkspaceId, currentPresentationId, getPresentation]);

  useEffect(() => {
    if (currentPresentation) {
      setTitle(currentPresentation.title);
      try {
        const parsed = typeof currentPresentation.slides === 'string'
          ? JSON.parse(currentPresentation.slides)
          : currentPresentation.slides;
        setSlides(Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ title: 'Slide 1', content: '' }]);
      } catch {
        setSlides([{ title: 'Slide 1', content: '' }]);
      }
      setLastSaved(new Date(currentPresentation.updatedAt));
      setHasChanges(false);
    }
  }, [currentPresentation]);

  const savePresentation = useCallback(async () => {
    if (!currentWorkspaceId || !currentPresentationId || !hasChanges) return;
    setIsSaving(true);
    try {
      await updatePresentation(currentWorkspaceId, currentPresentationId, {
        title,
        slides,
      });
      setLastSaved(new Date());
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [currentWorkspaceId, currentPresentationId, title, slides, hasChanges, updatePresentation]);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => savePresentation(), 2000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, slides, hasChanges, savePresentation]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasChanges(true);
  };

  const updateSlide = (idx: number, field: keyof Slide, value: string) => {
    const newSlides = slides.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    setSlides(newSlides);
    setHasChanges(true);
  };

  const addSlide = () => {
    const newSlide: Slide = { title: `Slide ${slides.length + 1}`, content: '' };
    const newSlides = [...slides];
    newSlides.splice(activeSlideIdx + 1, 0, newSlide);
    setSlides(newSlides);
    setActiveSlideIdx(activeSlideIdx + 1);
    setHasChanges(true);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== idx);
    setSlides(newSlides);
    if (activeSlideIdx >= newSlides.length) {
      setActiveSlideIdx(newSlides.length - 1);
    } else if (activeSlideIdx > idx) {
      setActiveSlideIdx(activeSlideIdx - 1);
    }
    setHasChanges(true);
  };

  const moveSlideUp = (idx: number) => {
    if (idx === 0) return;
    const newSlides = [...slides];
    [newSlides[idx - 1], newSlides[idx]] = [newSlides[idx], newSlides[idx - 1]];
    setSlides(newSlides);
    if (activeSlideIdx === idx) setActiveSlideIdx(idx - 1);
    else if (activeSlideIdx === idx - 1) setActiveSlideIdx(idx);
    setHasChanges(true);
  };

  const moveSlideDown = (idx: number) => {
    if (idx === slides.length - 1) return;
    const newSlides = [...slides];
    [newSlides[idx], newSlides[idx + 1]] = [newSlides[idx + 1], newSlides[idx]];
    setSlides(newSlides);
    if (activeSlideIdx === idx) setActiveSlideIdx(idx + 1);
    else if (activeSlideIdx === idx + 1) setActiveSlideIdx(idx);
    setHasChanges(true);
  };

  const handleBack = () => {
    if (hasChanges) savePresentation();
    if (currentWorkspaceId) {
      navigate('workspace', {
        workspaceId: currentWorkspaceId,
        subView: 'presentations',
      });
    }
  };

  const activeSlide = slides[activeSlideIdx];

  if (isLoading && !currentPresentation) {
    return (
      <div className="flex h-full flex-col p-6">
        <Skeleton className="mb-4 h-8 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-64 w-48" />
          <Skeleton className="h-64 flex-1" />
        </div>
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
            placeholder="Presentation title"
          />
        </div>
        <div className="flex items-center gap-2">
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
                <Button variant="ghost" size="icon" onClick={savePresentation} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save</TooltipContent>
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

      {/* Main Content: Slide List + Editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slide List Sidebar */}
        <div className="w-52 border-r bg-muted/20 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-xs font-medium text-muted-foreground">Slides</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addSlide}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              <AnimatePresence>
                {slides.map((slide, idx) => (
                  <motion.div
                    key={idx}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-sm',
                        idx === activeSlideIdx && 'ring-2 ring-primary shadow-sm'
                      )}
                      onClick={() => setActiveSlideIdx(idx)}
                    >
                      <CardContent className="p-2">
                        <div className="flex items-start gap-1.5">
                          <div className="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={(e) => { e.stopPropagation(); moveSlideUp(idx); }}
                              disabled={idx === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={(e) => { e.stopPropagation(); moveSlideDown(idx); }}
                              disabled={idx === slides.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">{idx + 1}.</span>
                              <p className="text-xs font-medium truncate">{slide.title || 'Untitled'}</p>
                            </div>
                            <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
                              {slide.content || 'No content'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 text-destructive shrink-0"
                            onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                            disabled={slides.length <= 1}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Slide Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSlide ? (
            <motion.div
              key={activeSlideIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto max-w-3xl"
            >
              {/* Slide Preview */}
              <div className="mb-6 rounded-lg border bg-white shadow-sm aspect-video p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {activeSlide.title || 'Untitled Slide'}
                </h2>
                <div className="text-gray-600 whitespace-pre-wrap">
                  {activeSlide.content || 'Click to add content...'}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Slide Editing */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Slide Title</label>
                  <Input
                    value={activeSlide.title}
                    onChange={(e) => updateSlide(activeSlideIdx, 'title', e.target.value)}
                    placeholder="Slide title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Slide Content</label>
                  <Textarea
                    value={activeSlide.content}
                    onChange={(e) => updateSlide(activeSlideIdx, 'content', e.target.value)}
                    placeholder="Slide content (markdown supported)"
                    className="min-h-[200px]"
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>No slide selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
