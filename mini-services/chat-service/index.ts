import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/socket.io/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ---- Types ----
interface OnlineUser {
  userId: string
  username: string
  avatar: string | null
  socketId: string
  currentChannelId: string | null
  currentWorkspaceId: string | null
}

interface TypingUser {
  userId: string
  username: string
  channelId: string
  timestamp: number
}

// ---- In-memory state ----
const onlineUsers = new Map<string, OnlineUser>() // socketId -> OnlineUser
const userSocketMap = new Map<string, Set<string>>() // userId -> Set<socketId>
const typingUsers = new Map<string, TypingUser>() // `${channelId}:${userId}` -> TypingUser

// ---- Helper functions ----
function getOnlineUsersInWorkspace(workspaceId: string): OnlineUser[] {
  return Array.from(onlineUsers.values()).filter(
    (u) => u.currentWorkspaceId === workspaceId
  )
}

function getOnlineUsersInChannel(channelId: string): OnlineUser[] {
  return Array.from(onlineUsers.values()).filter(
    (u) => u.currentChannelId === channelId
  )
}

function getTypingUsersInChannel(channelId: string): TypingUser[] {
  return Array.from(typingUsers.values()).filter(
    (t) => t.channelId === channelId
  )
}

// Clean up stale typing indicators (older than 5 seconds)
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of typingUsers.entries()) {
    if (now - value.timestamp > 5000) {
      typingUsers.delete(key)
      // Notify channel that user stopped typing
      io.to(`channel:${value.channelId}`).emit('typing-stop', {
        userId: value.userId,
        channelId: value.channelId,
      })
    }
  }
}, 3000)

// ---- Socket.IO Event Handlers ----
io.on('connection', (socket) => {
  console.log(`[ChatService] Socket connected: ${socket.id}`)

  // ---- User authentication / presence ----
  socket.on(
    'user-online',
    (data: {
      userId: string
      username: string
      avatar: string | null
      workspaceId?: string
    }) => {
      const { userId, username, avatar, workspaceId } = data

      // Store user info
      const user: OnlineUser = {
        userId,
        username,
        avatar,
        socketId: socket.id,
        currentChannelId: null,
        currentWorkspaceId: workspaceId || null,
      }
      onlineUsers.set(socket.id, user)

      // Track multiple sockets per user
      if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set())
      }
      userSocketMap.get(userId)!.add(socket.id)

      // Join user's personal room for targeted messages
      socket.join(`user:${userId}`)

      // If workspace provided, join workspace room
      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`)
      }

      // Notify workspace members of online presence
      if (workspaceId) {
        io.to(`workspace:${workspaceId}`).emit('presence-update', {
          userId,
          username,
          avatar,
          status: 'online',
        })
      }

      // Send current online users list
      if (workspaceId) {
        const workspaceOnline = getOnlineUsersInWorkspace(workspaceId)
        socket.emit('online-users', {
          workspaceId,
          users: workspaceOnline.map((u) => ({
            userId: u.userId,
            username: u.username,
            avatar: u.avatar,
          })),
        })
      }

      console.log(
        `[ChatService] User online: ${username} (${userId}), workspace: ${workspaceId || 'none'}`
      )
    }
  )

  // ---- Channel join/leave ----
  socket.on(
    'channel-join',
    (data: { channelId: string; workspaceId: string }) => {
      const { channelId, workspaceId } = data
      const user = onlineUsers.get(socket.id)
      if (!user) return

      // Leave previous channel room
      if (user.currentChannelId) {
        socket.leave(`channel:${user.currentChannelId}`)
        // Notify previous channel that user stopped typing
        const typingKey = `${user.currentChannelId}:${user.userId}`
        if (typingUsers.has(typingKey)) {
          typingUsers.delete(typingKey)
          io.to(`channel:${user.currentChannelId}`).emit('typing-stop', {
            userId: user.userId,
            channelId: user.currentChannelId,
          })
        }
      }

      // Join new channel room
      socket.join(`channel:${channelId}`)
      user.currentChannelId = channelId
      user.currentWorkspaceId = workspaceId

      // Send current typing users in this channel
      const channelTyping = getTypingUsersInChannel(channelId).filter(
        (t) => t.userId !== user.userId
      )
      if (channelTyping.length > 0) {
        socket.emit('typing-update', {
          channelId,
          users: channelTyping.map((t) => ({
            userId: t.userId,
            username: t.username,
          })),
        })
      }

      // Send online users in this channel
      const channelOnline = getOnlineUsersInChannel(channelId)
      socket.emit('channel-online-users', {
        channelId,
        users: channelOnline.map((u) => ({
          userId: u.userId,
          username: u.username,
          avatar: u.avatar,
        })),
      })

      console.log(
        `[ChatService] ${user.username} joined channel: ${channelId}`
      )
    }
  )

  socket.on('channel-leave', (data: { channelId: string }) => {
    const { channelId } = data
    const user = onlineUsers.get(socket.id)
    if (!user) return

    socket.leave(`channel:${channelId}`)

    // Remove typing indicator for this channel
    const typingKey = `${channelId}:${user.userId}`
    if (typingUsers.has(typingKey)) {
      typingUsers.delete(typingKey)
      io.to(`channel:${channelId}`).emit('typing-stop', {
        userId: user.userId,
        channelId,
      })
    }

    if (user.currentChannelId === channelId) {
      user.currentChannelId = null
    }

    console.log(
      `[ChatService] ${user.username} left channel: ${channelId}`
    )
  })

  // ---- New message broadcast ----
  socket.on(
    'new-message',
    (data: {
      messageId: string
      channelId: string
      workspaceId: string
      userId: string
      content: string
      parentId?: string
      createdAt: string
    }) => {
      const user = onlineUsers.get(socket.id)
      if (!user) return

      // Broadcast to all users in the channel (including sender for consistency)
      io.to(`channel:${data.channelId}`).emit('message-received', {
        id: data.messageId,
        channelId: data.channelId,
        workspaceId: data.workspaceId,
        userId: data.userId,
        username: user.username,
        avatar: user.avatar,
        content: data.content,
        parentId: data.parentId || null,
        isEdited: false,
        isPinned: false,
        isDeleted: false,
        replyCount: 0,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
      })

      // Clear typing for this user in this channel
      const typingKey = `${data.channelId}:${data.userId}`
      typingUsers.delete(typingKey)
      io.to(`channel:${data.channelId}`).emit('typing-stop', {
        userId: data.userId,
        channelId: data.channelId,
      })

      console.log(
        `[ChatService] Message in channel ${data.channelId}: ${data.content.substring(0, 50)}`
      )
    }
  )

  // ---- Message edited ----
  socket.on(
    'message-edited',
    (data: {
      messageId: string
      channelId: string
      content: string
      isEdited: boolean
    }) => {
      io.to(`channel:${data.channelId}`).emit('message-updated', {
        id: data.messageId,
        content: data.content,
        isEdited: data.isEdited,
      })
    }
  )

  // ---- Message deleted ----
  socket.on(
    'message-deleted',
    (data: { messageId: string; channelId: string }) => {
      io.to(`channel:${data.channelId}`).emit('message-deleted', {
        id: data.messageId,
        isDeleted: true,
        content: 'This message has been deleted',
      })
    }
  )

  // ---- Typing indicators ----
  socket.on(
    'typing-start',
    (data: { channelId: string; userId: string; username: string }) => {
      const { channelId, userId, username } = data
      const typingKey = `${channelId}:${userId}`

      typingUsers.set(typingKey, {
        userId,
        username,
        channelId,
        timestamp: Date.now(),
      })

      // Broadcast to other users in the channel
      socket.to(`channel:${channelId}`).emit('typing-start', {
        userId,
        username,
        channelId,
      })

      console.log(`[ChatService] ${username} typing in ${channelId}`)
    }
  )

  socket.on(
    'typing-stop',
    (data: { channelId: string; userId: string }) => {
      const { channelId, userId } = data
      const typingKey = `${channelId}:${userId}`

      typingUsers.delete(typingKey)

      socket.to(`channel:${channelId}`).emit('typing-stop', {
        userId,
        channelId,
      })
    }
  )

  // ---- Read receipts ----
  socket.on(
    'message-read',
    (data: {
      channelId: string
      messageId: string
      userId: string
      username: string
    }) => {
      // Notify the message author that their message was read
      io.to(`channel:${data.channelId}`).emit('message-read-receipt', {
        channelId: data.channelId,
        messageId: data.messageId,
        userId: data.userId,
        username: data.username,
      })
    }
  )

  // ---- Presence status change ----
  socket.on(
    'status-change',
    (data: {
      userId: string
      username: string
      avatar: string | null
      status: 'online' | 'offline' | 'away' | 'busy'
      workspaceId?: string
    }) => {
      const { userId, workspaceId } = data

      // Notify workspace members of status change
      if (workspaceId) {
        io.to(`workspace:${workspaceId}`).emit('presence-update', {
          userId: data.userId,
          username: data.username,
          avatar: data.avatar,
          status: data.status,
        })
      }
    }
  )

  // ---- Notification events ----
  socket.on(
    'send-notification',
    (data: {
      userId: string
      notification: {
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
      }
    }) => {
      // Send real-time notification to the specific user
      io.to(`user:${data.userId}`).emit('new-notification', data.notification)
      console.log(`[ChatService] Notification sent to user ${data.userId}: ${data.notification.title}`)
    }
  )

  // ---- Disconnect ----
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id)
    if (!user) {
      console.log(`[ChatService] Unknown socket disconnected: ${socket.id}`)
      return
    }

    // Remove from online users
    onlineUsers.delete(socket.id)

    // Remove from user socket map
    const sockets = userSocketMap.get(user.userId)
    if (sockets) {
      sockets.delete(socket.id)
      if (sockets.size === 0) {
        userSocketMap.delete(user.userId)

        // User is fully offline - notify workspace
        if (user.currentWorkspaceId) {
          io.to(`workspace:${user.currentWorkspaceId}`).emit(
            'presence-update',
            {
              userId: user.userId,
              username: user.username,
              avatar: user.avatar,
              status: 'offline',
            }
          )
        }
      }
    }

    // Clean up typing indicators
    if (user.currentChannelId) {
      const typingKey = `${user.currentChannelId}:${user.userId}`
      if (typingUsers.has(typingKey)) {
        typingUsers.delete(typingKey)
        io.to(`channel:${user.currentChannelId}`).emit('typing-stop', {
          userId: user.userId,
          channelId: user.currentChannelId,
        })
      }
    }

    console.log(
      `[ChatService] User disconnected: ${user.username} (${socket.id})`
    )
  })

  socket.on('error', (error) => {
    console.error(`[ChatService] Socket error (${socket.id}):`, error)
  })
})

// ---- Start server ----
const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[ChatService] WebSocket server running on port ${PORT}`)
})

// ---- Graceful shutdown ----
process.on('SIGTERM', () => {
  console.log('[ChatService] Received SIGTERM, shutting down...')
  httpServer.close(() => {
    console.log('[ChatService] Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[ChatService] Received SIGINT, shutting down...')
  httpServer.close(() => {
    console.log('[ChatService] Server closed')
    process.exit(0)
  })
})
