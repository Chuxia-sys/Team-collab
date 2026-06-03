'use client';

import React, { useState } from 'react';
import { Hash, Megaphone, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useUIStore } from '@/stores/uiStore';
import { useChannelStore } from '@/stores/channelStore';
import { toast } from '@/hooks/use-toast';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChannelDialog({ open, onOpenChange }: CreateChannelDialogProps) {
  const { currentWorkspaceId, navigate } = useUIStore();
  const { createChannel, isLoading, error, clearError } = useChannelStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'text' | 'voice' | 'announcement'>('text');
  const [isPrivate, setIsPrivate] = useState(false);
  const [topic, setTopic] = useState('');

  const handleCreate = async () => {
    if (!currentWorkspaceId || !name.trim()) return;

    const channel = await createChannel(currentWorkspaceId, {
      name: name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: description.trim() || undefined,
      type,
      isPrivate,
      topic: topic.trim() || undefined,
    });

    if (channel) {
      toast({
        title: channel._isExisting ? 'Channel already exists' : 'Channel created',
        description: channel._isExisting
          ? `Navigated to #${channel.name}`
          : `#${channel.name} has been created`,
      });
      navigate('workspace', {
        workspaceId: currentWorkspaceId,
        subView: 'channel',
        channelId: channel.id,
      });
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('text');
    setIsPrivate(false);
    setTopic('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
      clearError();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Create a new channel to organize conversations by topic. Choose a name and type for your channel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error display */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Channel Type */}
          <div className="space-y-2">
            <Label>Channel Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Text</div>
                      <div className="text-xs text-muted-foreground">Send messages, images, and more</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="voice">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Voice</div>
                      <div className="text-xs text-muted-foreground">Hang out together with voice and video</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="announcement">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Announcement</div>
                      <div className="text-xs text-muted-foreground">Post updates for everyone</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel Name</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="new-channel"
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) {
                    handleCreate();
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="channel-topic">Topic</Label>
            <Input
              id="channel-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What is this channel about?"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="channel-desc">Description</Label>
            <Textarea
              id="channel-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this channel"
              rows={2}
            />
          </div>

          {/* Private Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Private Channel</Label>
              <p className="text-xs text-muted-foreground">
                Only invited members can see this channel
              </p>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Channel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
