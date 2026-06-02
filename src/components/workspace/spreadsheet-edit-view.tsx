'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Download,
  Plus,
  Table2,
  Rows3,
  Columns3,
  Trash2,
  Check,
  Loader2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useSpreadsheetStore } from '@/stores/spreadsheetStore';
import { format } from 'date-fns';

export function SpreadsheetEditView() {
  const { currentWorkspaceId, currentSpreadsheetId, navigate } = useUIStore();
  const {
    currentSpreadsheet,
    isLoading,
    getSpreadsheet,
    updateSpreadsheet,
  } = useSpreadsheetStore();

  const [title, setTitle] = useState('');
  const [columns, setColumns] = useState<string[]>(['A', 'B', 'C', 'D']);
  const [rows, setRows] = useState<string[][]>([['', '', '', '']]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [editingColIdx, setEditingColIdx] = useState<number | null>(null);
  const [colEditValue, setColEditValue] = useState('');

  useEffect(() => {
    if (currentWorkspaceId && currentSpreadsheetId) {
      getSpreadsheet(currentWorkspaceId, currentSpreadsheetId);
    }
  }, [currentWorkspaceId, currentSpreadsheetId, getSpreadsheet]);

  const [initializedSsId, setInitializedSsId] = useState<string | null>(null);
  if (currentSpreadsheet && currentSpreadsheet.id !== initializedSsId) {
    setInitializedSsId(currentSpreadsheet.id);
    setTitle(currentSpreadsheet.title);
    try {
      const parsedCols = typeof currentSpreadsheet.columns === 'string'
        ? JSON.parse(currentSpreadsheet.columns)
        : currentSpreadsheet.columns;
      const parsedRows = typeof currentSpreadsheet.rows === 'string'
        ? JSON.parse(currentSpreadsheet.rows)
        : currentSpreadsheet.rows;
      setColumns(Array.isArray(parsedCols) ? parsedCols : ['A', 'B', 'C', 'D']);
      setRows(Array.isArray(parsedRows) ? parsedRows : [['', '', '', '']]);
    } catch {
      setColumns(['A', 'B', 'C', 'D']);
      setRows([['', '', '', '']]);
    }
    setLastSaved(new Date(currentSpreadsheet.updatedAt));
    setHasChanges(false);
  }

  const saveSpreadsheet = useCallback(async () => {
    if (!currentWorkspaceId || !currentSpreadsheetId || !hasChanges) return;
    setIsSaving(true);
    try {
      await updateSpreadsheet(currentWorkspaceId, currentSpreadsheetId, {
        title,
        columns,
        rows,
      });
      setLastSaved(new Date());
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [currentWorkspaceId, currentSpreadsheetId, title, columns, rows, hasChanges, updateSpreadsheet]);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveSpreadsheet(), 2000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, columns, rows, hasChanges, saveSpreadsheet]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setHasChanges(true);
  };

  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    const newRows = rows.map((row, rIdx) =>
      rIdx === rowIdx
        ? row.map((cell, cIdx) => (cIdx === colIdx ? value : cell))
        : row
    );
    setRows(newRows);
    setHasChanges(true);
  };

  const updateColumnName = (colIdx: number, value: string) => {
    const newCols = columns.map((col, idx) => (idx === colIdx ? value : col));
    setColumns(newCols);
    setHasChanges(true);
  };

  const handleColumnDoubleClick = (colIdx: number) => {
    setEditingColIdx(colIdx);
    setColEditValue(columns[colIdx]);
  };

  const handleColumnEditSubmit = () => {
    if (editingColIdx !== null && colEditValue.trim()) {
      updateColumnName(editingColIdx, colEditValue.trim());
    }
    setEditingColIdx(null);
    setColEditValue('');
  };

  const handleColumnEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleColumnEditSubmit();
    } else if (e.key === 'Escape') {
      setEditingColIdx(null);
      setColEditValue('');
    }
  };

  const addColumn = () => {
    const newColName = String.fromCharCode(65 + columns.length);
    setColumns([...columns, newColName]);
    setRows(rows.map((row) => [...row, '']));
    setHasChanges(true);
  };

  const addRow = () => {
    setRows([...rows, new Array(columns.length).fill('')]);
    setHasChanges(true);
  };

  const removeColumn = (colIdx: number) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((_, idx) => idx !== colIdx));
    setRows(rows.map((row) => row.filter((_, idx) => idx !== colIdx)));
    setHasChanges(true);
  };

  const removeRow = (rowIdx: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, idx) => idx !== rowIdx));
    setHasChanges(true);
  };

  const handleBack = () => {
    if (hasChanges) saveSpreadsheet();
    if (currentWorkspaceId) {
      navigate('workspace', {
        workspaceId: currentWorkspaceId,
        subView: 'spreadsheets',
      });
    }
  };

  if (isLoading && !currentSpreadsheet) {
    return (
      <div className="flex h-full flex-col p-6">
        <Skeleton className="mb-4 h-8 w-64" />
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
            <Table2 className="h-4 w-4 text-primary" />
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="h-8 max-w-sm border-none text-lg font-semibold shadow-none focus-visible:ring-0"
              placeholder="Spreadsheet title"
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

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={saveSpreadsheet} disabled={isSaving}>
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

      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-4 py-2 bg-muted/30">
        <Button
          variant="outline"
          size="sm"
          onClick={addColumn}
          className="gap-1.5 hover:bg-primary/5 hover:border-primary/30 hover:text-primary"
        >
          <Columns3 className="h-3.5 w-3.5" />
          Add Column
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={addRow}
          className="gap-1.5 hover:bg-primary/5 hover:border-primary/30 hover:text-primary"
        >
          <Rows3 className="h-3.5 w-3.5" />
          Add Row
        </Button>
        <span className="text-xs text-muted-foreground ml-2">
          {rows.length} rows × {columns.length} columns
        </span>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-primary/5">
                <th className="w-14 border border-border bg-muted/60 px-2 py-2 text-xs font-semibold text-muted-foreground text-center">
                  #
                </th>
                {columns.map((col, idx) => (
                  <th key={idx} className="border border-border min-w-[140px] bg-muted/60 group/header relative">
                    {editingColIdx === idx ? (
                      <Input
                        autoFocus
                        value={colEditValue}
                        onChange={(e) => setColEditValue(e.target.value)}
                        onBlur={handleColumnEditSubmit}
                        onKeyDown={handleColumnEditKeyDown}
                        className="h-8 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary text-xs font-semibold text-center bg-primary/5"
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-primary/10 transition-colors"
                        onDoubleClick={() => handleColumnDoubleClick(idx)}
                      >
                        <span className="text-xs font-semibold text-foreground">{col}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 shrink-0 opacity-0 group-hover/header:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); removeColumn(idx); }}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    )}
                  </th>
                ))}
                <th className="w-10 border border-border bg-muted/30">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-full text-muted-foreground hover:text-primary"
                    onClick={addColumn}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={cn(
                    'group/row transition-colors',
                    rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                    'hover:bg-primary/5'
                  )}
                >
                  <td className="border border-border bg-muted/40 px-2 py-0 text-center">
                    <div className="flex items-center justify-center gap-0.5 h-8">
                      <span className="text-xs text-muted-foreground font-medium">{rowIdx + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 opacity-0 group-hover/row:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeRow(rowIdx)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </td>
                  {row.map((cell, colIdx) => (
                    <td key={colIdx} className="border border-border p-0">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                        className={cn(
                          'w-full h-8 px-2.5 text-sm bg-transparent outline-none transition-colors',
                          'focus:bg-primary/5 focus:ring-1 focus:ring-primary/30 focus:inset-shadow-sm',
                          'placeholder:text-muted-foreground/40'
                        )}
                        placeholder="—"
                      />
                    </td>
                  ))}
                  <td className="border border-border bg-muted/20" />
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Row button at bottom */}
          <div className="mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={addRow}
              className="w-full gap-1.5 text-muted-foreground hover:text-primary border border-dashed border-muted-foreground/30 hover:border-primary/40"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Row
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-4 py-2 bg-muted/20">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Spreadsheets
        </button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{rows.length} rows</span>
          <span>×</span>
          <span>{columns.length} columns</span>
        </div>
      </div>
    </div>
  );
}
