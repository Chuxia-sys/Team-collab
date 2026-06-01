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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import { format, formatDistanceToNow } from 'date-fns';

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  mention: <AtSign className="h-4 w-4 text-blue-500" />,
  message: <MessageSquare className="h-4 w-4 text-green-500" />,
  invite: <UserPlus className="h-4 w-4 text-purple-500" />,
  task_assigned: <ListTodo className="h-4 w-4 text-orange-500" />,
  info: <Info className="h-4 w-4 text-gray-500" />,
};

const NOTIFICATION_BG: Record<string, string> = {
  mention: 'bg-blue-50',
  message: 'bg-green-50',
  invite: 'bg-purple-50',
  task_assigned: 'bg-orange-50',
  info: 'bg-gray-50',
};

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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-xl font-bold">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
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
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BellOff className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm mt-1">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="space-y-1 p-4">
            <AnimatePresence>
              {notifications.map((notification, index) => {
                const icon =
                  NOTIFICATION_ICONS[notification.type] ||
                  NOTIFICATION_ICONS.info;
                const bgColor =
                  NOTIFICATION_BG[notification.type] || NOTIFICATION_BG.info;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15, delay: index * 0.02 }}
                  >
                    <Card
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-sm',
                        !notification.read && 'border-l-4 border-l-primary'
                      )}
                      onClick={() =>
                        handleClick(notification.id, notification.read)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                              bgColor
                            )}
                          >
                            {icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
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
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {notification.message}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                              )}
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
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
