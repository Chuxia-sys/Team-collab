'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Presentation,
  Plus,
  Search,
  Clock,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/stores/uiStore';
import { usePresentationStore } from '@/stores/presentationStore';
import { format } from 'date-fns';

export function PresentationsView() {
  const { currentWorkspaceId, navigate } = useUIStore();
  const { presentations, isLoading, loadPresentations, createPresentation } = usePresentationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadPresentations(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadPresentations]);

  const filteredPresentations = presentations.filter((pres) =>
    pres.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSlideCount = (pres: typeof presentations[0]): number => {
    try {
      const slides = typeof pres.slides === 'string' ? JSON.parse(pres.slides) : pres.slides;
      return Array.isArray(slides) ? slides.length : 0;
    } catch {
      return 0;
    }
  };

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

      {/* Search */}
      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search presentations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Presentation Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="mb-3 h-5 w-3/4" />
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
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPresentations.map((pres, index) => {
              const slideCount = getSlideCount(pres);
              return (
                <motion.div
                  key={pres.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <Card
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                    onClick={() => handleOpenPresentation(pres.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-orange-100 p-2">
                          <Presentation className="h-5 w-5 text-orange-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold truncate">{pres.title}</h3>
                          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(pres.updatedAt), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              {slideCount} slide{slideCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                          {pres.creator && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              by {pres.creator.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
