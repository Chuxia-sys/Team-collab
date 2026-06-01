'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  File,
  FileType2,
  FileCode,
  Plus,
  Search,
  Clock,
  Layers,
  LayoutGrid,
  List,
  ArrowUpDown,
  HardDrive,
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
import { useDocumentStore } from '@/stores/documentStore';
import { format } from 'date-fns';

// Document type icon mapping
const DOC_TYPE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  md: { icon: FileCode, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Markdown' },
  doc: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Document' },
  txt: { icon: File, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Text' },
  pdf: { icon: FileType2, color: 'text-red-600', bg: 'bg-red-100', label: 'PDF' },
  default: { icon: FileText, color: 'text-primary', bg: 'bg-primary/10', label: 'Document' },
};

function getDocTypeInfo(title: string) {
  const ext = title.split('.').pop()?.toLowerCase() || '';
  return DOC_TYPE_ICONS[ext] || DOC_TYPE_ICONS.default;
}

// Estimate file size from content
function estimateFileSize(content: string): string {
  const bytes = new TextEncoder().encode(content).length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Get first line of content as preview snippet
function getPreviewSnippet(content: string): string {
  if (!content) return 'Empty document';
  const firstLine = content.split('\n').find((l) => l.trim()) || '';
  return firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine;
}

type SortOption = 'date' | 'name' | 'version';
type ViewMode = 'grid' | 'list';

export function DocumentsView() {
  const { currentWorkspaceId, navigate } = useUIStore();
  const { documents, isLoading, loadDocuments, createDocument } = useDocumentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date');

  useEffect(() => {
    if (currentWorkspaceId) {
      loadDocuments(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadDocuments]);

  const filteredDocs = useMemo(() => {
    let filtered = documents.filter((doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'version':
          return b.version - a.version;
        default:
          return 0;
      }
    });
    return filtered;
  }, [documents, searchQuery, sortBy]);

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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-6 py-4 border-b">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
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
              <SelectItem value="version">Version</SelectItem>
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

      {/* Document Grid/List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'space-y-3'
          }>
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
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocs.map((doc, index) => {
              const typeInfo = getDocTypeInfo(doc.title);
              const TypeIcon = typeInfo.icon;
              const previewSnippet = getPreviewSnippet(doc.content);
              const fileSize = estimateFileSize(doc.content);

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <Card
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 group overflow-hidden"
                    onClick={() => handleOpenDocument(doc.id)}
                  >
                    {/* Gradient top bar */}
                    <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/40" />
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-lg ${typeInfo.bg} p-2.5 shrink-0 group-hover:scale-110 transition-transform`}>
                          <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{doc.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {previewSnippet}
                          </p>
                          <div className="mt-2 flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(doc.updatedAt), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              v{doc.version}
                            </div>
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {fileSize}
                            </div>
                          </div>
                          {doc.creator && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <div className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[8px] font-bold">
                                {doc.creator.name.slice(0, 1).toUpperCase()}
                              </div>
                              <span className="text-[11px] text-muted-foreground">{doc.creator.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Tags */}
                      {doc.tags && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {doc.tags.split(',').filter(Boolean).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1">
            {filteredDocs.map((doc, index) => {
              const typeInfo = getDocTypeInfo(doc.title);
              const TypeIcon = typeInfo.icon;
              const previewSnippet = getPreviewSnippet(doc.content);
              const fileSize = estimateFileSize(doc.content);

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                >
                  <div
                    className="flex items-center gap-4 rounded-lg border p-3 transition-all hover:bg-muted/30 hover:border-primary/20 cursor-pointer group"
                    onClick={() => handleOpenDocument(doc.id)}
                  >
                    <div className={`rounded-lg ${typeInfo.bg} p-2 shrink-0`}>
                      <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{doc.title}</h3>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">{typeInfo.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{previewSnippet}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {fileSize}
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        v{doc.version}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(doc.updatedAt), 'MMM d')}
                      </div>
                      {doc.creator && (
                        <span className="text-[11px]">{doc.creator.name}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
