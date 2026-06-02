'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  MessageSquare,
  AtSign,
  UserPlus,
  ListTodo,
  Info,
  CheckCheck,
  Clock,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification as NotificationType } from '@/types';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  mention: <AtSign className="h-4 w-4 text-blue-600" />,
  message: <MessageSquare className="h-4 w-4 text-emerald-600" />,
  invite: <UserPlus className="h-4 w-4 text-purple-600" />,
  task_assigned: <ListTodo className="h-4 w-4 text-amber-600" />,
  info: <Info className="h-4 w-4 text-gray-600" />,
};

const NOTIFICATION_BG: Record<string, string> = {
  mention: 'bg-blue-100 dark:bg-blue-950/30',
  message: 'bg-emerald-100 dark:bg-emerald-950/30',
  invite: 'bg-purple-100 dark:bg-purple-950/30',
  task_assigned: 'bg-amber-100 dark:bg-amber-950/30',
  info: 'bg-gray-100 dark:bg-gray-800',
};

const NOTIFICATION_BORDER: Record<string, string> = {
  mention: 'border-l-blue-500',
  message: 'border-l-emerald-500',
  invite: 'border-l-purple-500',
  task_assigned: 'border-l-amber-500',
  info: 'border-l-gray-400',
};

interface NotificationGroup {
  label: string;
  notifications: NotificationType[];
}

function groupNotificationsByDate(notifications: NotificationType[]): NotificationGroup[] {
  const groups: NotificationGroup[] = [];
  const today = notifications.filter((n) => isToday(new Date(n.createdAt)));
  const yesterday = notifications.filter((n) => isYesterday(new Date(n.createdAt)));
  const earlier = notifications.filter((n) => {
    const date = new Date(n.createdAt);
    return !isToday(date) && !isYesterday(date);
  });

  if (today.length > 0) groups.push({ label: 'Today', notifications: today });
  if (yesterday.length > 0) groups.push({ label: 'Yesterday', notifications: yesterday });
  if (earlier.length > 0) groups.push({ label: 'Earlier', notifications: earlier });

  return groups;
}

function NotificationCard({
  notification,
  index,
  onRead,
  onClick,
}: {
  notification: NotificationType;
  index: number;
  onRead: (e: React.MouseEvent, id: string) => void;
  onClick: (id: string, isRead: boolean) => void;
}) {
  const icon = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.info;
  const bgColor = NOTIFICATION_BG[notification.type] || NOTIFICATION_BG.info;
  const borderColor = NOTIFICATION_BORDER[notification.type] || NOTIFICATION_BORDER.info;

  const unreadClasses = !notification.read
    ? cn('border-l-4', borderColor, 'bg-primary/5')
    : '';

  return (
    <motion.div
      key={notification.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
    >
      <Card
        className={cn('cursor-pointer transition-all hover:shadow-md', unreadClasses)}
        onClick={() => onClick(notification.id, notification.read)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                bgColor
              )}
            >
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm',
                      !notification.read
                        ? 'font-semibold'
                        : 'font-medium text-muted-foreground'
                    )}
                  >
                    {notification.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-primary hover:text-primary hover:bg-primary/10"
                      onClick={(e) => onRead(e, notification.id)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Read
                    </Button>
                  )}
                  {!notification.read && (
                    <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                  )}
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function NotificationsView() {
  const { notifications, unreadCount, isLoading, loadNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(id);
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await markAsRead(id);
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <div className="relative mb-6">
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
                <BellOff className="h-10 w-10 text-primary/40" />
              </div>
              <div className="absolute -top-1 -right-1 size-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="size-3.5 text-emerald-600" />
              </div>
            </div>
            <p className="text-lg font-semibold">No notifications</p>
            <p className="text-sm mt-1 text-muted-foreground">You&apos;re all caught up! Check back later.</p>
          </div>
        ) : (
          <div className="p-4">
            {groupedNotifications.map((group) => (
              <div key={group.label} className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-2">
                  <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    {group.label}
                  </span>
                  <Separator className="flex-1" />
                  <span className="text-[10px] text-muted-foreground">{group.notifications.length}</span>
                </div>
                <div className="space-y-1">
                  <AnimatePresence>
                    {group.notifications.map((notification, index) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        index={index}
                        onRead={handleMarkAsRead}
                        onClick={handleClick}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
