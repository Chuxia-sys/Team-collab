'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { toast } from '@/hooks/use-toast';
import type { Task } from '@/types';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTask?: Task | null;
}

function TaskFormContent({
  editTask,
  onOpenChange,
}: {
  editTask?: Task | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { currentWorkspaceId } = useUIStore();
  const { createTask, updateTask, isLoading } = useTaskStore();
  const { members } = useWorkspaceStore();

  const [title, setTitle] = useState(editTask?.title ?? '');
  const [description, setDescription] = useState(editTask?.description ?? '');
  const [priority, setPriority] = useState<Task['priority']>(editTask?.priority ?? 'medium');
  const [assigneeId, setAssigneeId] = useState<string>(editTask?.assigneeId ?? '_none');
  const [dueDate, setDueDate] = useState(
    editTask?.dueDate ? editTask.dueDate.split('T')[0] : ''
  );

  const handleSubmit = async () => {
    if (!currentWorkspaceId || !title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigneeId: assigneeId === '_none' ? undefined : assigneeId,
      dueDate: dueDate || undefined,
    };

    if (editTask) {
      await updateTask(currentWorkspaceId, editTask.id, {
        ...taskData,
        assigneeId: assigneeId === '_none' ? null : assigneeId,
        dueDate: dueDate || null,
      });
      toast({
        title: 'Task updated',
        description: `"${title.trim()}" has been updated`,
      });
    } else {
      const task = await createTask(currentWorkspaceId, taskData);
      if (task) {
        toast({
          title: 'Task created',
          description: `"${title.trim()}" has been added`,
        });
      }
    }

    onOpenChange(false);
  };

  return (
    <div className="space-y-4 py-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && title.trim()) {
              handleSubmit();
            }
          }}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="task-desc">Description</Label>
        <Textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the task..."
          rows={3}
        />
      </div>

      {/* Priority & Assignee Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Task['priority'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Low
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Assignee</Label>
          <Select value={assigneeId} onValueChange={setAssigneeId}>
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">
                <span className="text-muted-foreground">Unassigned</span>
              </SelectItem>
              {members.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  <span className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.user?.avatar || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {(member.user?.name || '??').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {member.user?.name || 'Unknown'}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Due Date */}
      <div className="space-y-2">
        <Label htmlFor="task-due">Due Date</Label>
        <Input
          id="task-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || isLoading}
        >
          {isLoading
            ? editTask
              ? 'Updating...'
              : 'Creating...'
            : editTask
              ? 'Update Task'
              : 'Create Task'}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function CreateTaskDialog({ open, onOpenChange, editTask }: CreateTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>
        {/* Using key to reset form state when dialog opens with different editTask */}
        <TaskFormContent
          key={editTask ? editTask.id : 'create'}
          editTask={editTask}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
