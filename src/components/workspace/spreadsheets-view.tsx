'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Table2,
  Plus,
  Search,
  Clock,
  LayoutGrid,
  List,
  ArrowUpDown,
  Rows3,
  Columns3,
  Grid3X3,
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
import { useSpreadsheetStore } from '@/stores/spreadsheetStore';
import { format } from 'date-fns';

type SortOption = 'date' | 'name' | 'rows';
type ViewMode = 'grid' | 'list';

// Mini table preview component
function MiniTablePreview({ columns, rows }: { columns: string[]; rows: string[][] }) {
  const previewRows = rows.slice(0, 3);
  const previewCols = columns.slice(0, 4);

  return (
    <div className="rounded-md border overflow-hidden bg-background">
      <table className="w-full text-[8px]">
        <thead>
          <tr className="bg-primary/5">
            {previewCols.map((col, i) => (
              <th key={i} className="px-1.5 py-0.5 text-left font-semibold text-primary/70 border-b border-r last:border-r-0 truncate max-w-[40px]">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewRows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 1 ? 'bg-muted/30' : ''}>
              {previewCols.map((_, ci) => (
                <td key={ci} className="px-1.5 py-0.5 border-b border-r last:border-r-0 truncate max-w-[40px] text-muted-foreground">
                  {row[ci] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseSheetData(sheet: { columns: string; rows: string }) {
  try {
    const columns = typeof sheet.columns === 'string' ? JSON.parse(sheet.columns) : sheet.columns;
    const rows = typeof sheet.rows === 'string' ? JSON.parse(sheet.rows) : sheet.rows;
    return {
      columns: Array.isArray(columns) ? columns : [],
      rows: Array.isArray(rows) ? rows : [],
    };
  } catch {
    return { columns: [], rows: [] };
  }
}

export function SpreadsheetsView() {
  const { currentWorkspaceId, navigate } = useUIStore();
  const { spreadsheets, isLoading, loadSpreadsheets, createSpreadsheet } = useSpreadsheetStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date');

  useEffect(() => {
    if (currentWorkspaceId) {
      loadSpreadsheets(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadSpreadsheets]);

  const enrichedSpreadsheets = useMemo(() => {
    return spreadsheets.map((sheet) => {
      const { columns, rows } = parseSheetData(sheet);
      return { ...sheet, parsedColumns: columns, parsedRows: rows };
    });
  }, [spreadsheets]);

  const filteredSpreadsheets = useMemo(() => {
    let filtered = enrichedSpreadsheets.filter((sheet) =>
      sheet.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'rows':
          return b.parsedRows.length - a.parsedRows.length;
        default:
          return 0;
      }
    });
    return filtered;
  }, [enrichedSpreadsheets, searchQuery, sortBy]);

  const handleCreateSpreadsheet = async () => {
    if (!currentWorkspaceId) return;
    setIsCreating(true);
    try {
      const sheet = await createSpreadsheet(currentWorkspaceId, {
        title: 'Untitled Spreadsheet',
        columns: ['A', 'B', 'C', 'D'],
        rows: [['', '', '', '']],
      });
      if (sheet) {
        navigate('workspace', {
          workspaceId: currentWorkspaceId,
          subView: 'spreadsheet-edit',
          spreadsheetId: sheet.id,
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenSpreadsheet = (sheetId: string) => {
    if (!currentWorkspaceId) return;
    navigate('workspace', {
      workspaceId: currentWorkspaceId,
      subView: 'spreadsheet-edit',
      spreadsheetId: sheetId,
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-xl font-bold">Spreadsheets</h2>
          <p className="text-sm text-muted-foreground">{spreadsheets.length} spreadsheets</p>
        </div>
        <Button onClick={handleCreateSpreadsheet} disabled={isCreating} className="gap-2">
          <Plus className="h-4 w-4" />
          New Spreadsheet
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-6 py-4 border-b">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search spreadsheets..."
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
              <SelectItem value="rows">Row Count</SelectItem>
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

      {/* Spreadsheet Grid/List */}
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
                  <Skeleton className="mb-2 h-4 w-1/2" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSpreadsheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Table2 className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">
              {searchQuery ? 'No spreadsheets found' : 'No spreadsheets yet'}
            </p>
            <p className="text-sm mt-1">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first spreadsheet to get started'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSpreadsheets.map((sheet, index) => (
              <motion.div
                key={sheet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-emerald-300/50 hover:-translate-y-0.5 group overflow-hidden"
                  onClick={() => handleOpenSpreadsheet(sheet.id)}
                >
                  {/* Spreadsheet gradient top bar */}
                  <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
                  <CardContent className="p-4">
                    {/* Mini table preview */}
                    {sheet.parsedColumns.length > 0 && (
                      <div className="mb-3">
                        <MiniTablePreview columns={sheet.parsedColumns} rows={sheet.parsedRows} />
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-emerald-100 p-2.5 shrink-0 group-hover:scale-110 transition-transform">
                        <Table2 className="h-5 w-5 text-emerald-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold truncate group-hover:text-emerald-700 transition-colors">{sheet.title}</h3>
                        <div className="mt-2 flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Rows3 className="h-3 w-3" />
                            {sheet.parsedRows.length} row{sheet.parsedRows.length !== 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center gap-1">
                            <Columns3 className="h-3 w-3" />
                            {sheet.parsedColumns.length} col{sheet.parsedColumns.length !== 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center gap-1">
                            <Grid3X3 className="h-3 w-3" />
                            {sheet.parsedRows.length * sheet.parsedColumns.length} cells
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(sheet.updatedAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                        {sheet.creator && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <div className="flex size-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-bold">
                              {sheet.creator.name.slice(0, 1).toUpperCase()}
                            </div>
                            <span className="text-[11px] text-muted-foreground">{sheet.creator.name}</span>
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
            {filteredSpreadsheets.map((sheet, index) => (
              <motion.div
                key={sheet.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
              >
                <div
                  className="flex items-center gap-4 rounded-lg border p-3 transition-all hover:bg-muted/30 hover:border-emerald-300/30 cursor-pointer group"
                  onClick={() => handleOpenSpreadsheet(sheet.id)}
                >
                  <div className="rounded-lg bg-emerald-100 p-2 shrink-0">
                    <Table2 className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate group-hover:text-emerald-700 transition-colors">{sheet.title}</h3>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0 bg-emerald-50 text-emerald-700">
                        {sheet.parsedRows.length}×{sheet.parsedColumns.length}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sheet.parsedRows.length} rows · {sheet.parsedColumns.length} columns
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1">
                      <Rows3 className="h-3 w-3" />
                      {sheet.parsedRows.length}
                    </div>
                    <div className="flex items-center gap-1">
                      <Columns3 className="h-3 w-3" />
                      {sheet.parsedColumns.length}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(sheet.updatedAt), 'MMM d')}
                    </div>
                    {sheet.creator && (
                      <span className="text-[11px]">{sheet.creator.name}</span>
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
