'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotificationStore } from '@/stores/notificationStore'
import { useUIStore } from '@/stores/uiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  XCircle,
  FileText,
  ListTodo,
  AlertTriangle,
  Info,
  UserPlus,
  Hash,
  Clock,
  ExternalLink,
  Loader2,
  Inbox,
  X,
  Mail,
  MailOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

// ---- Helpers ----

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ---- Notification Icon Map ----

const notificationIcons: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  workspace_invite: { icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  channel_invite: { icon: Hash, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  task_assigned: { icon: ListTodo, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  task_updated: { icon: ListTodo, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  task_completed: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  task_due_soon: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  document_uploaded: { icon: FileText, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
  document_approved: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
  document_rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  document_review: { icon: FileText, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  system: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-950/30' },
  info: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-950/30' },
};

function getNotificationIcon(type: string) {
  return notificationIcons[type] || notificationIcons.info;
}

// ---- Skeleton Loader ----

function NotificationSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="size-9 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-2.5 bg-muted rounded w-1/2" />
          </div>
          <div className="size-4 bg-muted rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ---- Notification Item ----

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onAccept?: (invitationId: string, notificationId: string) => void;
  onDecline?: (invitationId: string, notificationId: string) => void;
  onNavigate: (link: string | null) => void;
}

function NotificationItem({ notification, onMarkRead, onAccept, onDecline, onNavigate }: NotificationItemProps) {
  const iconConfig = getNotificationIcon(notification.type);
  const IconComponent = iconConfig.icon;
  const isInvitation = notification.type === 'workspace_invite' || notification.type === 'channel_invite';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
        !notification.read && 'bg-muted/40 hover:bg-muted/60',
        notification.read && 'hover:bg-muted/20'
      )}
      onClick={() => {
        if (!notification.read) onMarkRead(notification.id);
        if (notification.link) onNavigate(notification.link);
      }}
    >
      {/* Unread indicator dot */}
      {!notification.read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary shrink-0" />
      )}

      {/* Icon */}
      <div className={cn('flex size-9 items-center justify-center rounded-full shrink-0 mt-0.5', iconConfig.bg)}>
        <IconComponent className={cn('size-4', iconConfig.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', !notification.read && 'font-medium')}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-muted-foreground/70 flex items-center gap-1">
            <Clock className="size-3" />
            {getRelativeTime(notification.createdAt)}
          </span>
          {isInvitation && notification.invitationId && (
            <span className="text-[11px] font-medium text-blue-500 flex items-center gap-0.5">
              <Mail className="size-3" />
              Invitation
            </span>
          )}
        </div>

        {/* Invitation Action Buttons */}
        {isInvitation && notification.invitationId && onAccept && onDecline && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs px-3 gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onAccept(notification.invitationId!, notification.id);
              }}
            >
              <CheckCircle2 className="size-3" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-3 gap-1 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onDecline(notification.invitationId!, notification.id);
              }}
            >
              <XCircle className="size-3" />
              Decline
            </Button>
          </div>
        )}
      </div>

      {/* Mark as read button */}
      {!notification.read && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-2"
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(notification.id);
          }}
        >
          <CheckCheck className="size-3.5 text-muted-foreground" />
        </Button>
      )}
    </motion.div>
  );
}

// ---- Empty State ----

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted/50 mb-4">
        <Inbox className="size-7 text-muted-foreground/60" />
      </div>
      <h4 className="text-sm font-medium text-foreground">All caught up!</h4>
      <p className="text-xs text-muted-foreground mt-1 max-w-50">
        You don&apos;t have any notifications right now.
      </p>
    </div>
  );
}

// ---- Error State ----

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 mb-3">
        <AlertTriangle className="size-5 text-red-500" />
      </div>
      <p className="text-sm font-medium text-foreground">Something went wrong</p>
      <p className="text-xs text-muted-foreground mt-1">{message}</p>
      <Button variant="outline" size="sm" className="mt-3 h-8 text-xs" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

// ---- Main NotificationCenter Component ----

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    isDropdownOpen,
    loadNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    acceptInvitation,
    declineInvitation,
    setDropdownOpen,
    clearError,
  } = useNotificationStore();

  const { navigate } = useUIStore();
  const { loadWorkspaces: loadWorkspaceList } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && notifications.length === 0 && !isLoading) {
      loadNotifications();
    }
  }, [isDropdownOpen, notifications.length, isLoading, loadNotifications]);

  // Periodic polling for new notifications (every 30s) when dropdown is closed
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Handle navigation from notification link
  const handleNavigate = useCallback((link: string | null) => {
    if (!link) return;

    // Parse the link (format: workspace/{workspaceId}/channel/{channelId} or similar)
    const parts = link.split('/');
    if (parts[0] === 'workspace' && parts[1]) {
      const workspaceId = parts[1];
      const subView = parts[2] || 'home';
      const extraParams: Record<string, string> = {};
      if (parts[3] && parts[2] === 'channel') {
        extraParams.channelId = parts[3];
      }
      navigate('workspace', { workspaceId, subView, ...extraParams });
    } else if (parts[0] === 'dashboard') {
      navigate('dashboard');
    }

    setDropdownOpen(false);
  }, [navigate, setDropdownOpen]);

  // Handle accept invitation
  const handleAccept = useCallback(async (invitationId: string, notificationId: string) => {
    const success = await acceptInvitation(invitationId, notificationId);
    if (success) {
      // Refresh notifications and workspace list so the new workspace appears
      loadNotifications();
      loadWorkspaceList();
    }
  }, [acceptInvitation, loadNotifications, loadWorkspaceList]);

  // Handle decline invitation
  const handleDecline = useCallback(async (invitationId: string, notificationId: string) => {
    await declineInvitation(invitationId, notificationId);
  }, [declineInvitation]);

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  // Display count for the tab
  const displayCount = activeTab === 'unread' ? unreadCount : notifications.length;

  return (
    <Popover open={isDropdownOpen} onOpenChange={setDropdownOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                'absolute -top-0.5 -right-0.5 size-4 min-w-4 p-0 text-[10px] flex items-center justify-center',
                unreadCount > 9 && 'min-w-4.5 px-0.5'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {/* Subtle ring animation when there are unread notifications */}
          {unreadCount > 0 && (
            <span className="absolute inset-0 rounded-full ring-2 ring-primary/20 animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        ref={popoverRef}
        align="end"
        sideOffset={8}
        className="w-95 sm:w-105 p-0 shadow-xl border-border/50 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={markAllAsRead}
              >
                <CheckCheck className="size-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sm:hidden">All read</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setDropdownOpen(false)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-muted/20">
          <button
            className={cn(
              'flex-1 text-xs font-medium py-2 transition-colors relative',
              activeTab === 'all'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('all')}
          >
            All
            {notifications.length > 0 && (
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                ({notifications.length})
              </span>
            )}
            {activeTab === 'all' && (
              <motion.div
                layoutId="notification-tab-indicator"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>
          <button
            className={cn(
              'flex-1 text-xs font-medium py-2 transition-colors relative',
              activeTab === 'unread'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('unread')}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                ({unreadCount})
              </span>
            )}
            {activeTab === 'unread' && (
              <motion.div
                layoutId="notification-tab-indicator"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-105 overflow-y-auto">
          {isLoading ? (
            <NotificationSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={() => loadNotifications()} />
          ) : filteredNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            <AnimatePresence initial={false}>
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onNavigate={handleNavigate}
                />
              ))}
            </AnimatePresence>
          )}

          {/* Load More */}
          {hasMore && !isLoading && (
            <div className="px-4 py-3 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs text-muted-foreground gap-2"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load more notifications'
                )}
              </Button>
            </div>
          )}
        </ScrollArea>

        {/* Footer with link to full notifications page */}
        {notifications.length > 0 && (
          <div className="border-t border-border/50 px-4 py-2 bg-muted/10">
            <button
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              onClick={() => {
                // Navigate to notifications page if inside a workspace
                navigate('workspace', { subView: 'notifications' });
                setDropdownOpen(false);
              }}
            >
              View all notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
