'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  Star,
  MessageSquare,
  XCircle,
  Search,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useRealtimeStore } from '@/stores/realtimeStore';
import { EmojiPicker } from '@/components/workspace/emoji-picker';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🤔', '👀'];

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

// Message reactions display
function MessageReactions({ reactions, onReact }: { reactions: Record<string, string[]>; onReact: (emoji: string) => void }) {
  const entries = Object.entries(reactions).filter(([, users]) => users.length > 0);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {entries.map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs hover:bg-primary/10 hover:border-primary/30 transition-colors"
        >
          <span className="text-sm">{emoji}</span>
          <span className="text-muted-foreground font-medium">{users.length}</span>
        </button>
      ))}
    </div>
  );
}

// Highlighted text component for search
function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function ChannelView() {
  const { currentWorkspaceId, currentChannelId, navigate } = useUIStore();
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
  const socketEmits = useRealtimeStore((s) => s.socketEmits);

  const [inputValue, setInputValue] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set());
  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Load channels if not loaded
  useEffect(() => {
    if (currentWorkspaceId) {
      loadChannels(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadChannels]);

  // Set current channel from channels list
  useEffect(() => {
    if (channels.length > 0) {
      if (currentChannelId) {
        const found = channels.find((c) => c.id === currentChannelId);
        if (found) {
          if (found.id !== currentChannel?.id) {
            setCurrentChannel(found);
          }
          return;
        }
      }
      // currentChannelId is stale or not set — fall back to first channel
      const fallback = channels.find((c) => c.name === 'general') || channels[0];
      if (fallback) {
        setCurrentChannel(fallback);
        if (currentWorkspaceId) {
          navigate('workspace', {
            workspaceId: currentWorkspaceId,
            subView: 'channel',
            channelId: fallback.id,
          });
        }
      }
    }
  }, [currentChannelId, channels, currentChannel, setCurrentChannel, currentWorkspaceId, navigate]);

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

  // Typing indicator: emit typing-start/stop based on input value
  useEffect(() => {
    if (!currentChannelId || !socketEmits) return;

    if (inputValue.trim() && !isTypingRef.current) {
      // User started typing
      isTypingRef.current = true;
      socketEmits.emitTypingStart(currentChannelId);
    } else if (!inputValue.trim() && isTypingRef.current) {
      // User stopped typing (cleared input)
      isTypingRef.current = false;
      socketEmits.emitTypingStop(currentChannelId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    // Reset the inactivity timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (inputValue.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          socketEmits.emitTypingStop(currentChannelId);
        }
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputValue, currentChannelId, socketEmits]);

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Emit typing stop if user was typing when leaving
      if (isTypingRef.current && currentChannelId && socketEmits) {
        socketEmits.emitTypingStop(currentChannelId);
      }
      isTypingRef.current = false;
    };
  }, [currentChannelId, socketEmits]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return messages
      .filter((m) => !m.isDeleted && m.content.toLowerCase().includes(query))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  const totalSearchResults = searchResults.length;

  // Navigate search results
  const navigateSearch = useCallback((direction: 'up' | 'down') => {
    if (searchResults.length === 0) return;
    let newIndex: number;
    if (direction === 'down') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }
    setCurrentSearchIndex(newIndex);

    // Scroll to the message
    const messageId = searchResults[newIndex];
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchResults, currentSearchIndex]);

  // Keyboard shortcut for search navigation
  useEffect(() => {
    if (!searchOpen || !searchQuery.trim()) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        navigateSearch(e.shiftKey ? 'up' : 'down');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, searchQuery, navigateSearch]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !currentWorkspaceId || !currentChannelId) return;

    if (editingMessage) {
      const content = inputValue.trim();
      await editMessage(editingMessage.id, content);
      setInputValue('');

      // Broadcast edit in real-time
      socketEmits?.emitMessageEdited({
        messageId: editingMessage.id,
        channelId: currentChannelId,
        content,
        isEdited: true,
      });
      return;
    }

    await sendMessage(
      currentWorkspaceId,
      currentChannelId,
      inputValue.trim(),
      replyingTo?.id
    );
    setInputValue('');

    // Broadcast new message in real-time
    const msgs = useMessageStore.getState().messages;
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg) {
      socketEmits?.emitNewMessage({
        messageId: lastMsg.id,
        channelId: currentChannelId,
        workspaceId: currentWorkspaceId,
        content: lastMsg.content,
        parentId: lastMsg.parentId || undefined,
        createdAt: lastMsg.createdAt,
      });
    }
  }, [inputValue, currentWorkspaceId, currentChannelId, editingMessage, replyingTo, editMessage, sendMessage, socketEmits]);

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
      // Broadcast deletion in real-time
      if (currentChannelId) {
        socketEmits?.emitMessageDeleted({
          messageId,
          channelId: currentChannelId,
        });
      }
    },
    [deleteMessage, currentChannelId, socketEmits]
  );

  const handlePin = useCallback(
    async (messageId: string, isPinned: boolean) => {
      await togglePinMessage(messageId, !isPinned);
    },
    [togglePinMessage]
  );

  const handleToggleBookmark = useCallback((messageId: string) => {
    setBookmarkedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  const handleReact = useCallback((messageId: string, emoji: string) => {
    setMessageReactions((prev) => {
      const next = { ...prev };
      const msgReactions = { ...(next[messageId] || {}) };
      const users = [...(msgReactions[emoji] || [])];
      const userId = user?.id || 'me';
      const idx = users.indexOf(userId);
      if (idx >= 0) {
        users.splice(idx, 1);
      } else {
        users.push(userId);
      }
      msgReactions[emoji] = users;
      next[messageId] = msgReactions;
      return next;
    });
  }, [user?.id]);

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

  // Channel members for info panel
  const channelMembers = members.slice(0, 8);

  // Filter messages by search
  const isSearchActive = searchQuery.trim().length > 0;

  if (!currentChannel) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Select a channel to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main chat area */}
      <div className="flex h-full flex-col flex-1 min-w-0">
        {/* Channel Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
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
            {/* Search Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={searchOpen ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSearchOpen(!searchOpen);
                      if (!searchOpen) {
                        setTimeout(() => searchInputRef.current?.focus(), 100);
                      } else {
                        setSearchQuery('');
                        setCurrentSearchIndex(0);
                      }
                    }}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search Messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowInfoPanel(!showInfoPanel)}>
                    <Users className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Members</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowInfoPanel(!showInfoPanel)}>
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Channel Info</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b shrink-0 overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentSearchIndex(0);
                    }}
                    placeholder="Search messages in #${currentChannel.name}..."
                    className="pl-9 h-8 text-sm"
                  />
                </div>
                {isSearchActive && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {totalSearchResults > 0
                        ? `${currentSearchIndex + 1} of ${totalSearchResults}`
                        : 'No results'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => navigateSearch('up')}
                      disabled={totalSearchResults === 0}
                    >
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => navigateSearch('down')}
                      disabled={totalSearchResults === 0}
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentSearchIndex(0);
                      }}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pinned Messages Banner */}
        <AnimatePresence>
          {pinnedMessages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b bg-primary/5 px-4 py-2 shrink-0"
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
              {messages.map((message, index) => {
                const isOwn = message.userId === user?.id;
                const isHovered = hoveredMessageId === message.id;
                const grouped = isGrouped(index);
                const isBookmarked = bookmarkedMessages.has(message.id);
                const reactions = messageReactions[message.id] || {};
                const isSearchMatch = isSearchActive && searchResults.includes(message.id);
                const isCurrentSearchMatch = isSearchActive && searchResults[currentSearchIndex] === message.id;

                return (
                  <React.Fragment key={message.id}>
                    {needsDateSeparator(index) && (
                      <DateSeparator date={message.createdAt} />
                    )}
                    <motion.div
                      id={`message-${message.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'group relative flex transition-colors',
                        isOwn ? 'justify-end' : 'justify-start',
                        message.isDeleted && 'opacity-50',
                        isCurrentSearchMatch && 'bg-primary/10 ring-2 ring-primary/30 rounded-lg',
                        isSearchMatch && !isCurrentSearchMatch && 'bg-primary/5 rounded-lg',
                      )}
                      onMouseEnter={() => setHoveredMessageId(message.id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                    >
                      {/* Chat bubble wrapper */}
                      <div className={cn(
                        'flex flex-col',
                        isOwn ? 'items-end' : 'items-start',
                        'max-w-[75%] md:max-w-[65%]',
                      )}>
                        {/* Reply Reference */}
                        {message.parentId && (
                          <div className={cn(
                            'mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground',
                            isOwn ? 'mr-2' : 'ml-2',
                          )}>
                            <Reply className="h-3 w-3" />
                            <span>Replying to {getMemberName(messages.find(m => m.id === message.parentId)?.userId || '')}</span>
                          </div>
                        )}

                        {/* Other user: avatar + name header (before bubble, for non-grouped) */}
                        {!isOwn && !grouped && (
                          <div className="flex items-end gap-2 mb-0.5 ml-1">
                            <Avatar className="h-6 w-6 shrink-0 ring-1 ring-background">
                              <AvatarImage src={getMemberAvatar(message.userId) || undefined} />
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                {getMemberName(message.userId).slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-semibold hover:underline cursor-pointer leading-none">
                                {getMemberName(message.userId)}
                              </span>
                              <span className="text-[11px] text-muted-foreground leading-none">
                                {format(new Date(message.createdAt), 'h:mm a')}
                              </span>
                              {message.isPinned && (
                                <Pin className="h-3 w-3 text-primary" />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Own user: small timestamp before bubble (for non-grouped) */}
                        {isOwn && !grouped && (
                          <div className="flex items-center gap-1.5 mr-1 mb-0.5">
                            <span className="text-[11px] text-muted-foreground">
                              {format(new Date(message.createdAt), 'h:mm a')}
                            </span>
                            {message.isPinned && (
                              <Pin className="h-3 w-3 text-primary" />
                            )}
                          </div>
                        )}

                        {/* The chat card/bubble */}
                        <div className={cn(
                          'relative rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words shadow-sm',
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-[#d3d3d3] text-foreground rounded-bl-md',
                          message.isDeleted && 'bg-muted/30 italic text-muted-foreground',
                          isBookmarked && isOwn && 'ring-2 ring-amber-500/30',
                          isBookmarked && !isOwn && 'ring-2 ring-amber-500/30',
                          // Grouped messages: no top rounding
                          grouped && isOwn && 'rounded-tr-md',
                          grouped && !isOwn && 'rounded-tl-md',
                          // Thread/reply reference
                          message.parentId && isOwn && 'rounded-tr-md',
                          message.parentId && !isOwn && 'rounded-tl-md',
                        )}>
                          {/* Bookmark indicator inside bubble */}
                          {isBookmarked && (
                            <span className="absolute -top-1.5 -right-1.5 text-amber-500">
                              <Star className="h-3.5 w-3.5 fill-amber-500 drop-shadow-sm" />
                            </span>
                          )}

                          {message.isDeleted ? (
                            <p className="text-sm italic">This message has been deleted</p>
                          ) : (
                            <>
                              {isSearchActive ? (
                                <HighlightedText text={message.content} highlight={searchQuery} />
                              ) : (
                                message.content
                              )}
                            </>
                          )}

                          {/* Timestamp for grouped messages (inside bubble) */}
                          {grouped && (
                            <span className={cn(
                              'block text-[10px] mt-1 leading-none',
                              isOwn ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground/60',
                            )}>
                              {format(new Date(message.createdAt), 'h:mm a')}
                            </span>
                          )}

                          {/* Edited indicator */}
                          {message.isEdited && !message.isDeleted && (
                            <span className={cn(
                              'text-[10px] ml-1',
                              isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground',
                            )}>(edited)</span>
                          )}
                        </div>

                        {/* Reactions - outside bubble, aligned to the message */}
                        <MessageReactions
                          reactions={reactions}
                          onReact={(emoji) => handleReact(message.id, emoji)}
                        />

                        {/* Thread indicator with reply count */}
                        {message.replyCount > 0 && (
                          <div className={cn(
                            'mt-0.5 flex items-center gap-1.5 text-xs text-primary cursor-pointer hover:underline',
                            isOwn ? 'mr-2' : 'ml-2',
                          )}>
                            <div className="flex -space-x-1">
                              {[...Array(Math.min(message.replyCount, 3))].map((_, i) => (
                                <div key={i} className="size-4 rounded-full bg-primary/10 border border-background flex items-center justify-center">
                                  <MessageSquare className="h-2 w-2 text-primary" />
                                </div>
                              ))}
                            </div>
                            <span className="font-medium">
                              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Hover Actions */}
                      <AnimatePresence>
                        {isHovered && !message.isDeleted && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                              'absolute top-0 flex items-center gap-0.5 rounded-md border bg-background p-0.5 shadow-sm z-10',
                              isOwn ? 'left-0 -translate-x-2' : 'right-0 translate-x-2',
                            )}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleReact(message.id, '👍')}
                                  >
                                    <Smile className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>React</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

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

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn('h-7 w-7', isBookmarked && 'text-amber-500')}
                                    onClick={() => handleToggleBookmark(message.id)}
                                  >
                                    <Star className={cn('h-3.5 w-3.5', isBookmarked && 'fill-amber-500')} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isBookmarked ? 'Unbookmark' : 'Bookmark'}</TooltipContent>
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
              className="shrink-0"
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Input */}
        <div className="border-t p-4 shrink-0">
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

          <div className="flex items-center gap-2 rounded-lg border bg-muted/85 px-3 py-1 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
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

            <EmojiPicker
              onEmojiSelect={(emoji) => setInputValue((prev) => prev + emoji)}
            />

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

      {/* Channel Info Panel */}
      <AnimatePresence>
        {showInfoPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l h-full overflow-hidden shrink-0"
          >
            <div className="w-[300px] h-full flex flex-col">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="font-semibold text-sm">Channel Info</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowInfoPanel(false)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {/* Channel icon and name */}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                      <Hash className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">{currentChannel.name}</h3>
                    {currentChannel.description && (
                      <p className="text-sm text-muted-foreground mt-1">{currentChannel.description}</p>
                    )}
                    {currentChannel.topic && (
                      <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-sm w-full">
                        <span className="text-muted-foreground text-xs block mb-0.5">Topic</span>
                        {currentChannel.topic}
                      </div>
                    )}
                  </div>

                  {/* Channel details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-[10px]">{currentChannel.type || 'text'}</Badge>
                      {currentChannel.isPrivate && (
                        <Badge variant="secondary" className="text-[10px]">Private</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Pin className="h-3.5 w-3.5" />
                      {pinnedMessages.length} pinned message{pinnedMessages.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {messages.length} message{messages.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <Separator />

                  {/* Members */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold">Members ({members.length})</h4>
                    </div>
                    <div className="space-y-1">
                      {channelMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/30 transition-colors"
                        >
                          <div className="relative">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={member.user?.avatar || undefined} />
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {(member.user?.name || '??').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background',
                              member.user?.status === 'online' ? 'bg-emerald-500' :
                              member.user?.status === 'away' ? 'bg-amber-500' : 'bg-gray-400'
                            )} />
                          </div>
                          <span className="text-xs font-medium truncate">{member.user?.name}</span>
                        </div>
                      ))}
                      {members.length > 8 && (
                        <p className="text-xs text-muted-foreground text-center pt-1">
                          +{members.length - 8} more members
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Bookmarked messages */}
                  {bookmarkedMessages.size > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="h-4 w-4 text-amber-500" />
                        <h4 className="text-sm font-semibold">Bookmarks ({bookmarkedMessages.size})</h4>
                      </div>
                      <div className="space-y-1">
                        {messages
                          .filter((m) => bookmarkedMessages.has(m.id))
                          .map((msg) => (
                            <div key={msg.id} className="rounded-lg bg-amber-50 dark:bg-amber-950/20 px-3 py-2 border border-amber-200 dark:border-amber-800">
                              <p className="text-xs line-clamp-2">{msg.content}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {getMemberName(msg.userId)} · {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
