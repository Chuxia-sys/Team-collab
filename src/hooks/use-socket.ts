'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useRealtimeStore } from '@/stores/realtimeStore'
import { useMessageStore } from '@/stores/messageStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { user } = useAuthStore()
  const { currentWorkspaceId, currentChannelId } = useUIStore()
  const {
    setConnected,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    addTypingUser,
    removeTypingUser,
    updatePresence,
    clearTypingForChannel,
  } = useRealtimeStore()

  // Track previous channel to leave when switching
  const prevChannelRef = useRef<string | null>(null)
  const prevWorkspaceRef = useRef<string | null>(null)
  const userIdRef = useRef(user?.id)

  // Keep userId ref in sync
  useEffect(() => {
    userIdRef.current = user?.id
  }, [user?.id])

  // Initialize socket connection
  useEffect(() => {
    if (!user) return

    const socket = io('http://localhost:3003', {
      path: '/',
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      // Identify user on connect
      socket.emit('user-online', {
        userId: user.id,
        username: user.name,
        avatar: user.avatar,
        workspaceId: useUIStore.getState().currentWorkspaceId || undefined,
      })
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    // ---- Presence events ----
    socket.on('online-users', (data: { workspaceId: string; users: Array<{ userId: string; username: string; avatar: string | null }> }) => {
      setOnlineUsers(data.workspaceId, data.users)
    })

    socket.on('presence-update', (data: { userId: string; username: string; avatar: string | null; status: 'online' | 'offline' | 'away' | 'busy' }) => {
      updatePresence(data)
      if (data.status === 'online') {
        addOnlineUser({ userId: data.userId, username: data.username, avatar: data.avatar })
      } else if (data.status === 'offline') {
        removeOnlineUser(data.userId)
      }
    })

    // ---- Typing events ----
    socket.on('typing-start', (data: { userId: string; username: string; channelId: string }) => {
      if (data.userId !== userIdRef.current) {
        addTypingUser(data.channelId, { userId: data.userId, username: data.username })
      }
    })

    socket.on('typing-stop', (data: { userId: string; channelId: string }) => {
      removeTypingUser(data.channelId, data.userId)
    })

    socket.on('typing-update', (data: { channelId: string; users: Array<{ userId: string; username: string }> }) => {
      // Full typing state sync - replace for channel
      const filtered = data.users.filter((u) => u.userId !== userIdRef.current)
      useRealtimeStore.getState().setTypingUsers(data.channelId, filtered)
    })

    // ---- Channel online users ----
    socket.on('channel-online-users', (data: { channelId: string; users: Array<{ userId: string; username: string; avatar: string | null }> }) => {
      // Update presence for these users
      data.users.forEach((u) => {
        updatePresence({ ...u, status: 'online' })
      })
    })

    // ---- Real-time notification events ----
    socket.on('new-notification', (data: {
      id: string
      userId: string
      type: string
      title: string
      message: string
      read: boolean
      link: string | null
      actorId: string | null
      workspaceId: string | null
      channelId: string | null
      invitationId: string | null
      createdAt: string
    }) => {
      useNotificationStore.getState().addRealTimeNotification(data as any)
    })

    // ---- Real-time message events ----
    socket.on('message-received', (data: {
      id: string
      channelId: string
      workspaceId: string
      userId: string
      username: string
      avatar: string | null
      content: string
      parentId: string | null
      isEdited: boolean
      isPinned: boolean
      isDeleted: boolean
      replyCount: number
      createdAt: string
      updatedAt: string
    }) => {
      // Don't add own messages (already added by sendMessage in store)
      if (data.userId === userIdRef.current) return

      useMessageStore.setState((state) => {
        const exists = state.messages.find((m) => m.id === data.id)
        if (exists) return state

        const newMessages = [...state.messages, data]
        if (data.parentId) {
          return {
            messages: newMessages.map((m) =>
              m.id === data.parentId
                ? { ...m, replyCount: m.replyCount + 1 }
                : m
            ),
          }
        }
        return { messages: newMessages }
      })
    })

    socket.on('message-updated', (data: { id: string; content: string; isEdited: boolean }) => {
      useMessageStore.setState((state) => ({
        messages: state.messages.map((m) =>
          m.id === data.id ? { ...m, content: data.content, isEdited: data.isEdited } : m
        ),
      }))
    })

    socket.on('message-deleted', (data: { id: string; isDeleted: boolean; content: string }) => {
      useMessageStore.setState((state) => ({
        messages: state.messages.map((m) =>
          m.id === data.id ? { ...m, isDeleted: data.isDeleted, content: data.content } : m
        ),
      }))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [user?.id])

  // Join/leave workspace room when workspace changes
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !socket.connected || !user) return

    if (prevWorkspaceRef.current && prevWorkspaceRef.current !== currentWorkspaceId) {
      socket.emit('user-online', {
        userId: user.id,
        username: user.name,
        avatar: user.avatar,
        workspaceId: currentWorkspaceId || undefined,
      })
    }

    if (currentWorkspaceId) {
      prevWorkspaceRef.current = currentWorkspaceId
    }
  }, [currentWorkspaceId, user])

  // Join/leave channel room when channel changes
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !socket.connected || !user) return

    // Leave previous channel
    if (prevChannelRef.current && prevChannelRef.current !== currentChannelId) {
      socket.emit('channel-leave', { channelId: prevChannelRef.current })
      clearTypingForChannel(prevChannelRef.current)
    }

    // Join new channel
    if (currentChannelId && currentWorkspaceId) {
      socket.emit('channel-join', {
        channelId: currentChannelId,
        workspaceId: currentWorkspaceId,
      })
      prevChannelRef.current = currentChannelId
    }

    return () => {
      // Clean up on unmount
      if (prevChannelRef.current) {
        socket.emit('channel-leave', { channelId: prevChannelRef.current })
      }
    }
  }, [currentChannelId, currentWorkspaceId])

  // ---- Emit methods ----
  const emitTypingStart = useCallback(
    (channelId: string) => {
      const socket = socketRef.current
      if (!socket?.connected || !user) return
      socket.emit('typing-start', {
        channelId,
        userId: user.id,
        username: user.name,
      })
    },
    [user]
  )

  const emitTypingStop = useCallback(
    (channelId: string) => {
      const socket = socketRef.current
      if (!socket?.connected || !user) return
      socket.emit('typing-stop', {
        channelId,
        userId: user.id,
      })
    },
    [user]
  )

  const emitNewMessage = useCallback(
    (data: {
      messageId: string
      channelId: string
      workspaceId: string
      content: string
      parentId?: string
      createdAt: string
    }) => {
      const socket = socketRef.current
      if (!socket?.connected || !user) return
      socket.emit('new-message', {
        ...data,
        userId: user.id,
      })
    },
    [user]
  )

  const emitMessageEdited = useCallback(
    (data: {
      messageId: string
      channelId: string
      content: string
      isEdited: boolean
    }) => {
      const socket = socketRef.current
      if (!socket?.connected) return
      socket.emit('message-edited', data)
    },
    []
  )

  const emitMessageDeleted = useCallback(
    (data: { messageId: string; channelId: string }) => {
      const socket = socketRef.current
      if (!socket?.connected) return
      socket.emit('message-deleted', data)
    },
    []
  )

  const emitMessageRead = useCallback(
    (data: {
      channelId: string
      messageId: string
    }) => {
      const socket = socketRef.current
      if (!socket?.connected || !user) return
      socket.emit('message-read', {
        ...data,
        userId: user.id,
        username: user.name,
      })
    },
    [user]
  )

  const emitStatusChange = useCallback(
    (status: 'online' | 'offline' | 'away' | 'busy') => {
      const socket = socketRef.current
      if (!socket?.connected || !user) return
      socket.emit('status-change', {
        userId: user.id,
        username: user.name,
        avatar: user.avatar,
        status,
        workspaceId: useUIStore.getState().currentWorkspaceId || undefined,
      })
    },
    [user]
  )

  // Store emit functions in the realtime store so other components can use them
  useEffect(() => {
    useRealtimeStore.getState().setSocketEmits({
      emitTypingStart,
      emitTypingStop,
      emitNewMessage,
      emitMessageEdited,
      emitMessageDeleted,
    })
  }, [emitTypingStart, emitTypingStop, emitNewMessage, emitMessageEdited, emitMessageDeleted])

  return {
    emitTypingStart,
    emitTypingStop,
    emitNewMessage,
    emitMessageEdited,
    emitMessageDeleted,
    emitMessageRead,
    emitStatusChange,
  }
}
