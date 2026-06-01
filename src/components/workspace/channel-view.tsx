'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  Pin,
  Users,
  Info,
  Send,
  Reply,
  Pencil,
  Trash2,
  Smile,
  MoreHorizontal,
  Check,
  X,
  PinOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useChannelStore } from '@/stores/channelStore';
import { useMessageStore } from '@/stores/messageStore';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { format } from 'date-fns';

export function ChannelView() {
  const { currentWorkspaceId, currentChannelId } = useUIStore();
  const { channels, currentChannel, setCurrentChannel, loadChannels } = useChannelStore();
  const {
    messages,
    isLoading,
    replyingTo,
    editingMessage,
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    togglePinMessage,
    setReplyingTo,
    setEditingMessage,
  } = useMessageStore();
  const { user } = useAuthStore();
  const { members } = useWorkspaceStore();

  const [inputValue, setInputValue] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load channels if not loaded
  useEffect(() => {
    if (currentWorkspaceId) {
      loadChannels(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadChannels]);

  // Set current channel from channels list
  useEffect(() => {
    if (currentChannelId && channels.length > 0) {
      const found = channels.find((c) => c.id === currentChannelId);
      if (found && found.id !== currentChannel?.id) {
        setCurrentChannel(found);
      }
    }
  }, [currentChannelId, channels, currentChannel, setCurrentChannel]);

  useEffect(() => {
    if (currentWorkspaceId && currentChannelId) {
      loadMessages(currentWorkspaceId, currentChannelId);
    }
  }, [currentWorkspaceId, currentChannelId, loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (replyingTo || editingMessage) {
      inputRef.current?.focus();
    }
  }, [replyingTo, editingMessage]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !currentWorkspaceId || !currentChannelId) return;

    if (editingMessage) {
      await editMessage(editingMessage.id, inputValue.trim());
      setInputValue('');
      return;
    }

    await sendMessage(
      currentWorkspaceId,
      currentChannelId,
      inputValue.trim(),
      replyingTo?.id
    );
    setInputValue('');
  }, [inputValue, currentWorkspaceId, currentChannelId, editingMessage, replyingTo, editMessage, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === 'Escape') {
        setReplyingTo(null);
        setEditingMessage(null);
        setInputValue('');
      }
    },
    [handleSend, setReplyingTo, setEditingMessage]
  );

  const handleReply = useCallback(
    (message: typeof messages[0]) => {
      setReplyingTo(message);
      setEditingMessage(null);
      if (!editingMessage) {
        setInputValue('');
      }
      inputRef.current?.focus();
    },
    [setReplyingTo, setEditingMessage, editingMessage]
  );

  const handleEdit = useCallback(
    (message: typeof messages[0]) => {
      setEditingMessage(message);
      setReplyingTo(null);
      setInputValue(message.content);
      inputRef.current?.focus();
    },
    [setEditingMessage, setReplyingTo]
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      await deleteMessage(messageId);
    },
    [deleteMessage]
  );

  const handlePin = useCallback(
    async (messageId: string, isPinned: boolean) => {
      await togglePinMessage(messageId, !isPinned);
    },
    [togglePinMessage]
  );

  const getMemberName = useCallback(
    (userId: string) => {
      const member = members.find((m) => m.userId === userId);
      return member?.user?.name || 'Unknown User';
    },
    [members]
  );

  const getMemberAvatar = useCallback(
    (userId: string) => {
      const member = members.find((m) => m.userId === userId);
      return member?.user?.avatar;
    },
    [members]
  );

  const pinnedMessages = messages.filter((m) => m.isPinned && !m.isDeleted);

  if (!currentChannel) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Select a channel to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Channel Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg font-semibold">{currentChannel.name}</span>
          {currentChannel.topic && (
            <>
              <Separator orientation="vertical" className="h-5" />
              <span className="text-sm text-muted-foreground truncate max-w-64">
                {currentChannel.topic}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pin className="h-4 w-4" />
                  {pinnedMessages.length > 0 && (
                    <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px]">
                      {pinnedMessages.length}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pinned Messages</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Users className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Members</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Channel Info</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Pinned Messages Banner */}
      <AnimatePresence>
        {pinnedMessages.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b bg-primary/5 px-4 py-2"
          >
            <div className="flex items-center gap-2 text-sm">
              <Pin className="h-3 w-3 text-primary" />
              <span className="font-medium text-primary">
                {pinnedMessages.length} Pinned Message{pinnedMessages.length > 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Hash className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Be the first to send a message in #{currentChannel.name}!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => {
              const isOwn = message.userId === user?.id;
              const isHovered = hoveredMessageId === message.id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'group relative rounded-lg px-2 py-1.5 transition-colors',
                    isHovered && 'bg-muted/50',
                    message.isDeleted && 'opacity-50'
                  )}
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {/* Reply Reference */}
                  {message.parentId && (
                    <div className="mb-1 ml-10 flex items-center gap-1 text-xs text-muted-foreground">
                      <Reply className="h-3 w-3" />
                      <span>Reply to {getMemberName(messages.find(m => m.id === message.parentId)?.userId || '')}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Avatar className="mt-0.5 h-9 w-9 shrink-0">
                      <AvatarImage src={getMemberAvatar(message.userId) || undefined} />
                      <AvatarFallback className="text-xs">
                        {getMemberName(message.userId).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold hover:underline cursor-pointer">
                          {getMemberName(message.userId)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                        {message.isPinned && (
                          <Pin className="h-3 w-3 text-primary" />
                        )}
                      </div>

                      {message.isDeleted ? (
                        <p className="text-sm italic text-muted-foreground">
                          This message has been deleted
                        </p>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}

                      {message.isEdited && !message.isDeleted && (
                        <span className="text-xs text-muted-foreground">(edited)</span>
                      )}

                      {message.replyCount > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-primary cursor-pointer hover:underline">
                          <Reply className="h-3 w-3" />
                          {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <AnimatePresence>
                    {isHovered && !message.isDeleted && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-2 top-0 flex items-center gap-0.5 rounded-md border bg-background p-0.5 shadow-sm"
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleReply(message)}
                              >
                                <Reply className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reply</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {isOwn && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEdit(message)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handlePin(message.id, message.isPinned)}
                              >
                                {message.isPinned ? (
                                  <PinOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Pin className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{message.isPinned ? 'Unpin' : 'Pin'}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Smile className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>React</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {isOwn && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(message.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Message
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        {/* Reply/Edit Indicator */}
        <AnimatePresence>
          {(replyingTo || editingMessage) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-2 flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm">
                {replyingTo && (
                  <>
                    <Reply className="h-4 w-4 text-primary" />
                    <span>
                      Replying to{' '}
                      <span className="font-semibold">{getMemberName(replyingTo.userId)}</span>
                    </span>
                  </>
                )}
                {editingMessage && (
                  <>
                    <Pencil className="h-4 w-4 text-primary" />
                    <span>Editing message</span>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setReplyingTo(null);
                  setEditingMessage(null);
                  setInputValue('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${currentChannel.name}`}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
