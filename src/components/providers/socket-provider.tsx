'use client'

import { useAuthStore } from '@/stores/authStore'
import { useSocket } from '@/hooks/use-socket'
import { useEffect } from 'react'
import { useNotificationStore } from '@/stores/notificationStore'

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()

  // Initialize socket connection when user is authenticated
  useSocket()

  // Load notifications when user is authenticated
  const { loadNotifications } = useNotificationStore()
  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user, loadNotifications])

  return <>{children}</>
}
