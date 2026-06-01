'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Calendar,
  User,
  AlertCircle,
  Filter,
  Inbox,
  Clock,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuthStore } from '@/stores/authStore';
import { CreateTaskDialog } from './create-task-dialog';
import { format, isPast, isToday } from 'date-fns';
import type { Task } from '@/types';

const COLUMNS: { id: Task['status']; label: string; color: string; bgColor: string; headerColor: string; emptyIcon: React.ElementType }[] = [
  { id: 'backlog', label: 'Backlog', color: 'bg-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-950/30', headerColor: 'text-gray-500', emptyIcon: Inbox },
  { id: 'todo', label: 'To Do', color: 'bg-blue-400', bgColor: 'bg-blue-50/50 dark:bg-blue-950/20', headerColor: 'text-blue-500', emptyIcon: Clock },
  { id: 'in_progress', label: 'In Progress', color: 'bg-amber-400', bgColor: 'bg-amber-50/50 dark:bg-amber-950/20', headerColor: 'text-amber-500', emptyIcon: Clock },
  { id: 'review', label: 'Review', color: 'bg-purple-400', bgColor: 'bg-purple-50/50 dark:bg-purple-950/20', headerColor: 'text-purple-500', emptyIcon: Clock },
  { id: 'done', label: 'Done', color: 'bg-emerald-400', bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20', headerColor: 'text-emerald-500', emptyIcon: Inbox },
];

const PRIORITY_BORDER_COLORS: Record<Task['priority'], string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-emerald-500',
};

const PRIORITY_BADGE_COLORS: Record<Task['priority'], string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
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

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'done';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-all hover:shadow-md border-l-4',
        PRIORITY_BORDER_COLORS[task.priority],
        isDragging && 'opacity-50 shadow-lg rotate-2',
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div {...attributes} {...listeners} className="mt-1 cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1">
              <p className="text-sm font-medium leading-tight">{task.title}</p>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
                className={cn('text-[10px] px-1.5 py-0', PRIORITY_BADGE_COLORS[task.priority])}
              >
                {task.priority}
              </Badge>

              {task.dueDate && (
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  isOverdue ? 'text-red-500 font-medium' :
                  isDueToday ? 'text-amber-500 font-medium' :
                  'text-muted-foreground'
                )}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueDate), 'MMM d')}
                  {isOverdue && <span className="text-[10px]">(overdue)</span>}
                  {isDueToday && <span className="text-[10px]">(today)</span>}
                </div>
              )}

              {assignee && (
                <div className="ml-auto flex items-center gap-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={assignee.avatar || undefined} />
                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
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

function EmptyColumnState({ column }: { column: typeof COLUMNS[number] }) {
  const EmptyIcon = column.emptyIcon;
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <EmptyIcon className={cn('size-8 mx-auto mb-2', column.headerColor, 'opacity-40')} />
      <p className="text-xs text-muted-foreground mb-1">No tasks yet</p>
      <p className="text-[10px] text-muted-foreground/60">Drag tasks here or create a new one</p>
    </div>
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

  // Filter state
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    if (currentWorkspaceId) {
      loadTasks(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadTasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterAssignee === 'unassigned' && task.assigneeId) return false;
      if (filterAssignee !== 'all' && filterAssignee !== 'unassigned' && task.assigneeId !== filterAssignee) return false;
      return true;
    });
  }, [tasks, filterPriority, filterAssignee]);

  const getTasksByStatus = useCallback(
    (status: Task['status']) => filteredTasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order),
    [filteredTasks]
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

  const hasActiveFilters = filterPriority !== 'all' || filterAssignee !== 'all';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4 bg-background">
        <div>
          <h2 className="text-xl font-bold">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b bg-muted/20">
        <Filter className="size-4 text-muted-foreground" />
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Urgent
              </span>
            </SelectItem>
            <SelectItem value="high">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                High
              </span>
            </SelectItem>
            <SelectItem value="medium">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                Medium
              </span>
            </SelectItem>
            <SelectItem value="low">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Low
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.userId} value={member.userId}>
                <span className="flex items-center gap-2">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[6px]">
                      {(member.user?.name || '??').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {member.user?.name || 'Unknown'}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => {
              setFilterPriority('all');
              setFilterAssignee('all');
            }}
          >
            Clear filters
          </Button>
        )}
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
                    className={cn('flex w-72 flex-shrink-0 flex-col rounded-xl border bg-muted/30 overflow-hidden', column.bgColor)}
                  >
                    {/* Column Header */}
                    <div className="flex items-center gap-2 px-3 py-3 border-b bg-background/50">
                      <div className={cn('h-2.5 w-2.5 rounded-full', column.color)} />
                      <h3 className={cn('text-sm font-semibold', column.headerColor)}>{column.label}</h3>
                      <Badge variant="secondary" className="ml-auto text-xs h-5 min-w-[20px] flex items-center justify-center">
                        {columnTasks.length}
                      </Badge>
                    </div>

                    {/* Column Tasks */}
                    <ScrollArea className="flex-1 px-2 pb-2">
                      <SortableContext
                        items={columnTasks.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2 pt-2">
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
                            <EmptyColumnState column={column} />
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
                <Card className="w-64 shadow-xl border-l-4 rotate-3" style={{ borderLeftColor: undefined }}>
                  <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l', {
                    'bg-red-500': activeTask.priority === 'urgent',
                    'bg-orange-500': activeTask.priority === 'high',
                    'bg-yellow-500': activeTask.priority === 'medium',
                    'bg-emerald-500': activeTask.priority === 'low',
                  })} />
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">{activeTask.title}</p>
                    <Badge
                      variant="outline"
                      className={cn('mt-2 text-[10px]', PRIORITY_BADGE_COLORS[activeTask.priority])}
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
