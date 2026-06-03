'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Presentation,
  Plus,
  Search,
  Clock,
  Layers,
  LayoutGrid,
  List,
  ArrowUpDown,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUIStore } from '@/stores/uiStore';
import { usePresentationStore } from '@/stores/presentationStore';
import { format } from 'date-fns';

function safeFormatDate(dateStr: string | undefined | null, fmt: string): string {
  if (!dateStr) return 'Unknown date';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Unknown date';
    return format(d, fmt);
  } catch {
    return 'Unknown date';
  }
}

type SortOption = 'date' | 'name' | 'slides';
type ViewMode = 'grid' | 'list';

// Slide thumbnail component
function SlideThumbnail({ title, index }: { title: string; index: number }) {
  return (
    <div className="rounded border bg-white dark:bg-card aspect-[16/10] flex flex-col items-center justify-center p-1 shadow-sm">
      <div className="w-full h-1 bg-amber-400/30 rounded mb-1" />
      <span className="text-[6px] text-gray-500 font-medium text-center line-clamp-2 leading-tight">
        {title}
      </span>
      <span className="text-[5px] text-gray-400 mt-0.5">{index + 1}</span>
    </div>
  );
}

function parseSlides(pres: { slides: string }): Array<{ title: string; content: string }> {
  try {
    const slides = typeof pres.slides === 'string' ? JSON.parse(pres.slides) : pres.slides;
    return Array.isArray(slides) ? slides : [];
  } catch {
    return [];
  }
}

export function PresentationsView() {
  const { currentWorkspaceId, navigate } = useUIStore();
  const { presentations, isLoading, loadPresentations, createPresentation } = usePresentationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date');

  useEffect(() => {
    if (currentWorkspaceId) {
      loadPresentations(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadPresentations]);

  const enrichedPresentations = useMemo(() => {
    return presentations.map((pres) => {
      const slides = parseSlides(pres);
      return { ...pres, parsedSlides: slides, slideCount: slides.length };
    });
  }, [presentations]);

  const filteredPresentations = useMemo(() => {
    let filtered = enrichedPresentations.filter((pres) =>
      pres.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'slides':
          return b.slideCount - a.slideCount;
        default:
          return 0;
      }
    });
    return filtered;
  }, [enrichedPresentations, searchQuery, sortBy]);

  const handleCreatePresentation = async () => {
    if (!currentWorkspaceId) return;
    setIsCreating(true);
    try {
      const pres = await createPresentation(currentWorkspaceId, {
        title: 'Untitled Presentation',
        slides: [{ title: 'Slide 1', content: '' }],
      });
      if (pres) {
        navigate('workspace', {
          workspaceId: currentWorkspaceId,
          subView: 'presentation-edit',
          presentationId: pres.id,
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenPresentation = (presId: string) => {
    if (!currentWorkspaceId) return;
    navigate('workspace', {
      workspaceId: currentWorkspaceId,
      subView: 'presentation-edit',
      presentationId: presId,
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-xl font-bold">Presentations</h2>
          <p className="text-sm text-muted-foreground">{presentations.length} presentations</p>
        </div>
        <Button onClick={handleCreatePresentation} disabled={isCreating} className="gap-2">
          <Plus className="h-4 w-4" />
          New Presentation
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-6 py-4 border-b">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search presentations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Last Modified</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="slides">Slide Count</SelectItem>
            </SelectContent>
          </Select>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(val) => { if (val) setViewMode(val as ViewMode); }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Presentation Grid/List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'space-y-3'
          }>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="mb-3 h-5 w-3/4" />
                  <Skeleton className="mb-2 h-20 w-full rounded" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPresentations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Presentation className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">
              {searchQuery ? 'No presentations found' : 'No presentations yet'}
            </p>
            <p className="text-sm mt-1">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first presentation to get started'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPresentations.map((pres, index) => (
              <motion.div
                key={pres.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-amber-300/50 hover:-translate-y-0.5 group overflow-hidden"
                  onClick={() => handleOpenPresentation(pres.id)}
                >
                  {/* Presentation gradient top bar */}
                  <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

                  {/* Slide preview thumbnails */}
                  <div className="px-4 pt-4 pb-2">
                    {pres.parsedSlides.length > 0 ? (
                      <div className="flex gap-1.5 overflow-hidden">
                        {pres.parsedSlides.slice(0, 4).map((slide, si) => (
                          <div key={si} className="flex-1 min-w-0">
                            <SlideThumbnail title={slide.title} index={si} />
                          </div>
                        ))}
                        {pres.slideCount > 4 && (
                          <div className="flex items-center justify-center w-8 shrink-0">
                            <Badge variant="secondary" className="text-[8px] h-5 px-1 bg-amber-50 text-amber-700">
                              +{pres.slideCount - 4}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-16 rounded bg-amber-50/50 border border-dashed border-amber-200">
                        <Monitor className="h-6 w-6 text-amber-300" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-orange-100 p-2.5 shrink-0 group-hover:scale-110 transition-transform">
                        <Presentation className="h-5 w-5 text-orange-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold truncate group-hover:text-amber-700 transition-colors">{pres.title}</h3>
                        <div className="mt-2 flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {pres.slideCount} slide{pres.slideCount !== 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {safeFormatDate(pres.updatedAt, 'MMM d, yyyy')}
                          </div>
                        </div>
                        {pres.creator && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <div className="flex size-4 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[8px] font-bold">
                              {pres.creator.name.slice(0, 1).toUpperCase()}
                            </div>
                            <span className="text-[11px] text-muted-foreground">{pres.creator.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1">
            {filteredPresentations.map((pres, index) => (
              <motion.div
                key={pres.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
              >
                <div
                  className="flex items-center gap-4 rounded-lg border p-3 transition-all hover:bg-muted/30 hover:border-amber-300/30 cursor-pointer group"
                  onClick={() => handleOpenPresentation(pres.id)}
                >
                  <div className="rounded-lg bg-orange-100 p-2 shrink-0">
                    <Presentation className="h-5 w-5 text-orange-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate group-hover:text-amber-700 transition-colors">{pres.title}</h3>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0 bg-amber-50 text-amber-700">
                        {pres.slideCount} slide{pres.slideCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pres.parsedSlides.slice(0, 3).map((s) => s.title).join(' · ') || 'No slides'}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {pres.slideCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {safeFormatDate(pres.updatedAt, 'MMM d')}
                    </div>
                    {pres.creator && (
                      <span className="text-[11px]">{pres.creator.name}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
