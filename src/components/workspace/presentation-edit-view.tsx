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
  Presentation,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
  const [isPresenting, setIsPresenting] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentWorkspaceId && currentPresentationId) {
      getPresentation(currentWorkspaceId, currentPresentationId);
    }
  }, [currentWorkspaceId, currentPresentationId, getPresentation]);

  const [initializedPresId, setInitializedPresId] = useState<string | null>(null);
  if (currentPresentation && currentPresentation.id !== initializedPresId) {
    setInitializedPresId(currentPresentation.id);
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

  // Presentation mode keyboard navigation
  useEffect(() => {
    if (!isPresenting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPresenting(false);
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setActiveSlideIdx((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveSlideIdx((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, slides.length]);

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

  // Presentation mode (fullscreen)
  if (isPresenting) {
    return (
      <div
        className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center"
        onClick={() => setActiveSlideIdx((prev) => Math.min(prev + 1, slides.length - 1))}
      >
        <div className="w-full max-w-5xl aspect-video bg-white rounded-lg shadow-2xl p-16 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {activeSlide?.title || 'Untitled Slide'}
          </h1>
          <div className="text-xl text-gray-600 whitespace-pre-wrap leading-relaxed">
            {activeSlide?.content || ''}
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/70 text-sm">
          <span>Slide {activeSlideIdx + 1} of {slides.length}</span>
          <span>•</span>
          <span>Click or arrow keys to navigate</span>
          <span>•</span>
          <button
            className="hover:text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); setIsPresenting(false); }}
          >
            Press ESC to exit
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10"
          onClick={(e) => { e.stopPropagation(); setIsPresenting(false); }}
        >
          <Minimize2 className="h-5 w-5" />
        </Button>
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
            <Presentation className="h-4 w-4 text-primary" />
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="h-8 max-w-sm border-none text-lg font-semibold shadow-none focus-visible:ring-0"
              placeholder="Presentation title"
            />
          </div>
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPresenting(true)}
            className="gap-1.5 hover:bg-primary/5 hover:border-primary/30 hover:text-primary"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Present
          </Button>

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
        <div className="w-56 border-r bg-muted/20 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2.5 border-b">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slides</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
              onClick={addSlide}
            >
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
                    <div
                      className={cn(
                        'group/slide relative cursor-pointer rounded-lg border transition-all',
                        idx === activeSlideIdx
                          ? 'ring-2 ring-primary shadow-md border-primary/30'
                          : 'border-border hover:shadow-sm hover:border-primary/20'
                      )}
                      onClick={() => setActiveSlideIdx(idx)}
                    >
                      {/* Slide number badge */}
                      <div className="absolute top-1.5 left-1.5 z-10">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'h-4 min-w-4 px-1 text-[9px] font-bold',
                            idx === activeSlideIdx
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {idx + 1}
                        </Badge>
                      </div>

                      {/* Slide thumbnail preview */}
                      <div className="aspect-video bg-white rounded-t-md p-3 pt-6 overflow-hidden">
                        <p className="text-[9px] font-bold text-gray-900 truncate">
                          {slide.title || 'Untitled'}
                        </p>
                        <p className="text-[7px] text-gray-500 mt-0.5 line-clamp-3">
                          {slide.content || 'No content'}
                        </p>
                      </div>

                      {/* Slide controls overlay */}
                      <div className="flex items-center justify-between px-1.5 py-1 bg-muted/50 rounded-b-md">
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); moveSlideUp(idx); }}
                            disabled={idx === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); moveSlideDown(idx); }}
                            disabled={idx === slides.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-destructive opacity-0 group-hover/slide:opacity-100 hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                          disabled={slides.length <= 1}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add Slide button at bottom */}
            <Button
              variant="outline"
              size="sm"
              onClick={addSlide}
              className="w-full mt-3 gap-1.5 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 border-dashed"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Slide
            </Button>
          </ScrollArea>
        </div>

        {/* Slide Editor */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
          {activeSlide ? (
            <motion.div
              key={activeSlideIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto max-w-3xl"
            >
              {/* Slide Preview Card */}
              <Card className="mb-6 overflow-hidden shadow-lg border-0">
                <div className="aspect-video bg-white p-10 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {activeSlide.title || 'Untitled Slide'}
                  </h2>
                  <div className="text-lg text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {activeSlide.content || 'Click to add content...'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-muted/50 border-t px-4 py-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Slide {activeSlideIdx + 1} of {slides.length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {title || 'Untitled Presentation'}
                  </span>
                </div>
              </Card>

              <Separator className="my-6" />

              {/* Slide Editing Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Slide Title</label>
                  <Input
                    value={activeSlide.title}
                    onChange={(e) => updateSlide(activeSlideIdx, 'title', e.target.value)}
                    placeholder="Slide title"
                    className="focus-visible:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Slide Content</label>
                  <Textarea
                    value={activeSlide.content}
                    onChange={(e) => updateSlide(activeSlideIdx, 'content', e.target.value)}
                    placeholder="Slide content (markdown supported)"
                    className="min-h-[200px] focus-visible:ring-primary/30 resize-none"
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

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-4 py-2 bg-muted/20">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Presentations
        </button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{slides.length} {slides.length === 1 ? 'slide' : 'slides'}</span>
        </div>
      </div>
    </div>
  );
}
