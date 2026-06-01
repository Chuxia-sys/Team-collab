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
  Paperclip,
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
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

// Typing indicator dots component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2">
      <div className="flex items-center gap-1">
        <motion.span
          className="size-1.5 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="size-1.5 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
        />
        <motion.span
          className="size-1.5 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
        />
      </div>
      <span className="text-xs text-muted-foreground">Someone is typing...</span>
    </div>
  );
}

// Date separator component
function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  let label: string;
  if (isToday(d)) label = 'Today';
  else if (isYesterday(d)) label = 'Yesterday';
  else label = format(d, 'MMMM d, yyyy');

  return (
    <div className="flex items-center gap-3 py-4">
      <Separator className="flex-1" />
      <span className="text-xs font-medium text-muted-foreground shrink-0">{label}</span>
      <Separator className="flex-1" />
    </div>
  );
}

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

  // Check if consecutive messages are from the same user (for grouping)
  const isGrouped = (index: number) => {
    if (index === 0) return false;
    const current = messages[index];
    const previous = messages[index - 1];
    if (current.userId !== previous.userId) return false;
    if (current.parentId) return false;
    // Only group if within 5 minutes
    const timeDiff = new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime();
    if (timeDiff > 5 * 60 * 1000) return false;
    return true;
  };

  // Check if we need a date separator
  const needsDateSeparator = (index: number) => {
    if (index === 0) return true;
    const current = new Date(messages[index].createdAt);
    const previous = new Date(messages[index - 1].createdAt);
    return !isSameDay(current, previous);
  };


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
          <div className="space-y-0">
            {messages.map((message, index) => {
              const isOwn = message.userId === user?.id;
              const isHovered = hoveredMessageId === message.id;
              const grouped = isGrouped(index);

              return (
                <React.Fragment key={message.id}>
                  {needsDateSeparator(index) && (
                    <DateSeparator date={message.createdAt} />
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'group relative rounded-lg px-2 py-0.5 transition-colors',
                      isHovered && 'bg-muted/50',
                      message.isDeleted && 'opacity-50',
                      grouped && 'pl-14'
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

                    <div className={cn('flex items-start gap-3', grouped ? 'py-0.5' : 'py-1')}>
                      {/* Avatar - only show for first message in group */}
                      {!grouped ? (
                        <Avatar className="mt-0.5 h-9 w-9 shrink-0 ring-1 ring-background">
                          <AvatarImage src={getMemberAvatar(message.userId) || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {getMemberName(message.userId).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-9 shrink-0 flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors">
                            {format(new Date(message.createdAt), 'HH:mm')}
                          </span>
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        {!grouped && (
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold hover:underline cursor-pointer">
                              {getMemberName(message.userId)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {format(new Date(message.createdAt), 'h:mm a')}
                            </span>
                            {message.isPinned && (
                              <Pin className="h-3 w-3 text-primary" />
                            )}
                          </div>
                        )}

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
                          <span className="text-[10px] text-muted-foreground">(edited)</span>
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
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {inputValue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <TypingIndicator />
          </motion.div>
        )}
      </AnimatePresence>

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

        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${currentChannel.name}`}
            className="flex-1 border-none shadow-none focus-visible:ring-0 px-1"
            disabled={isLoading}
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
                  <Smile className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Emoji</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="h-8 w-8 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
