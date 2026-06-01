'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Table2,
  Plus,
  Search,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/stores/uiStore';
import { useSpreadsheetStore } from '@/stores/spreadsheetStore';
import { format } from 'date-fns';

export function SpreadsheetsView() {
  const { currentWorkspaceId, navigate } = useUIStore();
  const { spreadsheets, isLoading, loadSpreadsheets, createSpreadsheet } = useSpreadsheetStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadSpreadsheets(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadSpreadsheets]);

  const filteredSpreadsheets = spreadsheets.filter((sheet) =>
    sheet.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Search */}
      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search spreadsheets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Spreadsheet Grid */}
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
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSpreadsheets.map((sheet, index) => (
              <motion.div
                key={sheet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                  onClick={() => handleOpenSpreadsheet(sheet.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-green-100 p-2">
                        <Table2 className="h-5 w-5 text-green-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold truncate">{sheet.title}</h3>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(sheet.updatedAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                        {sheet.creator && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            by {sheet.creator.name}
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
