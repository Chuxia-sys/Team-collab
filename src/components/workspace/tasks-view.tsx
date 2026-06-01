'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuthStore } from '@/stores/authStore';
import { CreateTaskDialog } from './create-task-dialog';
import { format } from 'date-fns';
import type { Task } from '@/types';

const COLUMNS: { id: Task['status']; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'bg-gray-500' },
  { id: 'todo', label: 'To Do', color: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { id: 'review', label: 'Review', color: 'bg-purple-500' },
  { id: 'done', label: 'Done', color: 'bg-green-500' },
];

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

function TaskCard({ task, onEdit, onDelete }: { task: Task; onEdit: (task: Task) => void; onDelete: (id: string) => void }) {
  const { members } = useWorkspaceStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignee = task.assignee || members.find((m) => m.userId === task.assigneeId)?.user;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div {...attributes} {...listeners} className="mt-1 cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1">
              <p className="text-sm font-medium leading-tight">{task.title}</p>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {task.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn('text-[10px] px-1.5 py-0', PRIORITY_COLORS[task.priority])}
              >
                {task.priority}
              </Badge>

              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </div>
              )}

              {assignee && (
                <div className="ml-auto">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={assignee.avatar || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {assignee.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TasksView() {
  const { currentWorkspaceId } = useUIStore();
  const { tasks, isLoading, loadTasks, updateTask, deleteTask } = useTaskStore();
  const { members } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    if (currentWorkspaceId) {
      loadTasks(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadTasks]);

  const getTasksByStatus = useCallback(
    (status: Task['status']) => tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order),
    [tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Visual feedback during drag
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !currentWorkspaceId) return;

    const activeTaskItem = tasks.find((t) => t.id === active.id);
    if (!activeTaskItem) return;

    // Determine the new status
    let newStatus: Task['status'] = activeTaskItem.status;

    // Check if dropped on a column or another task
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) {
      newStatus = overTask.status;
    } else {
      const targetColumn = COLUMNS.find((col) => col.id === over.id);
      if (targetColumn) {
        newStatus = targetColumn.id;
      }
    }

    if (newStatus !== activeTaskItem.status) {
      await updateTask(currentWorkspaceId, activeTaskItem.id, { status: newStatus });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (currentWorkspaceId) {
      await deleteTask(currentWorkspaceId, taskId);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-xl font-bold">Tasks</h2>
          <p className="text-sm text-muted-foreground">{tasks.length} total tasks</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full min-w-max">
              {COLUMNS.map((column) => {
                const columnTasks = getTasksByStatus(column.id);
                return (
                  <div
                    key={column.id}
                    className="flex w-72 flex-shrink-0 flex-col rounded-xl border bg-muted/30"
                  >
                    {/* Column Header */}
                    <div className="flex items-center gap-2 px-3 py-3">
                      <div className={cn('h-2.5 w-2.5 rounded-full', column.color)} />
                      <h3 className="text-sm font-semibold">{column.label}</h3>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {columnTasks.length}
                      </Badge>
                    </div>

                    {/* Column Tasks */}
                    <ScrollArea className="flex-1 px-2 pb-2">
                      <SortableContext
                        items={columnTasks.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          <AnimatePresence>
                            {columnTasks.map((task) => (
                              <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group"
                              >
                                <TaskCard
                                  task={task}
                                  onEdit={(t) => setEditingTask(t)}
                                  onDelete={handleDeleteTask}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {columnTasks.length === 0 && (
                            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                              Drop tasks here
                            </div>
                          )}
                        </div>
                      </SortableContext>
                    </ScrollArea>
                  </div>
                );
              })}
            </div>

            <DragOverlay>
              {activeTask && (
                <Card className="w-64 shadow-xl">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">{activeTask.title}</p>
                    <Badge
                      variant="outline"
                      className={cn('mt-2 text-[10px]', PRIORITY_COLORS[activeTask.priority])}
                    >
                      {activeTask.priority}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Create/Edit Task Dialog */}
      <CreateTaskDialog
        open={createDialogOpen || !!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingTask(null);
          }
        }}
        editTask={editingTask}
      />
    </div>
  );
}
