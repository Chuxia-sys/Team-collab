import { create } from 'zustand'

// ---- Types ----
export interface OnlineUser {
  userId: string
  username: string
  avatar: string | null
}

export interface TypingUser {
  userId: string
  username: string
}

export interface RealtimeMessage {
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
}

export interface PresenceUpdate {
  userId: string
  username: string
  avatar: string | null
  status: 'online' | 'offline' | 'away' | 'busy'
}

interface RealtimeState {
  isConnected: boolean
  onlineUsers: OnlineUser[]
  typingUsers: Record<string, TypingUser[]> // channelId -> typing users
  userPresence: Record<string, 'online' | 'offline' | 'away' | 'busy'> // userId -> status
}

interface RealtimeActions {
  setConnected: (connected: boolean) => void
  setOnlineUsers: (workspaceId: string, users: OnlineUser[]) => void
  addOnlineUser: (user: OnlineUser) => void
  removeOnlineUser: (userId: string) => void
  setTypingUsers: (channelId: string, users: TypingUser[]) => void
  addTypingUser: (channelId: string, user: TypingUser) => void
  removeTypingUser: (channelId: string, userId: string) => void
  updatePresence: (data: PresenceUpdate) => void
  clearTypingForChannel: (channelId: string) => void
  reset: () => void
}

const initialState: RealtimeState = {
  isConnected: false,
  onlineUsers: [],
  typingUsers: {},
  userPresence: {},
}

export const useRealtimeStore = create<RealtimeState & RealtimeActions>(
  (set) => ({
    ...initialState,

    setConnected: (connected) => set({ isConnected: connected }),

    setOnlineUsers: (_workspaceId, users) => {
      const presenceMap: Record<string, 'online' | 'offline' | 'away' | 'busy'> = {}
      users.forEach((u) => {
        presenceMap[u.userId] = 'online'
      })
      set((state) => ({
        onlineUsers: users,
        userPresence: { ...state.userPresence, ...presenceMap },
      }))
    },

    addOnlineUser: (user) =>
      set((state) => {
        const exists = state.onlineUsers.find((u) => u.userId === user.userId)
        if (exists) return state
        return {
          onlineUsers: [...state.onlineUsers, user],
          userPresence: {
            ...state.userPresence,
            [user.userId]: 'online',
          },
        }
      }),

    removeOnlineUser: (userId) =>
      set((state) => ({
        onlineUsers: state.onlineUsers.filter((u) => u.userId !== userId),
        userPresence: {
          ...state.userPresence,
          [userId]: 'offline',
        },
      })),

    setTypingUsers: (channelId, users) =>
      set((state) => ({
        typingUsers: { ...state.typingUsers, [channelId]: users },
      })),

    addTypingUser: (channelId, user) =>
      set((state) => {
        const current = state.typingUsers[channelId] || []
        const exists = current.find((u) => u.userId === user.userId)
        if (exists) return state
        return {
          typingUsers: {
            ...state.typingUsers,
            [channelId]: [...current, user],
          },
        }
      }),

    removeTypingUser: (channelId, userId) =>
      set((state) => {
        const current = state.typingUsers[channelId] || []
        return {
          typingUsers: {
            ...state.typingUsers,
            [channelId]: current.filter((u) => u.userId !== userId),
          },
        }
      }),

    updatePresence: (data) =>
      set((state) => {
        const newOnlineUsers =
          data.status === 'offline'
            ? state.onlineUsers.filter((u) => u.userId !== data.userId)
            : state.onlineUsers.find((u) => u.userId === data.userId)
              ? state.onlineUsers
              : [
                  ...state.onlineUsers,
                  {
                    userId: data.userId,
                    username: data.username,
                    avatar: data.avatar,
                  },
                ]

        return {
          onlineUsers: newOnlineUsers,
          userPresence: {
            ...state.userPresence,
            [data.userId]: data.status,
          },
        }
      }),

    clearTypingForChannel: (channelId) =>
      set((state) => {
        const newTyping = { ...state.typingUsers }
        delete newTyping[channelId]
        return { typingUsers: newTyping }
      }),

    reset: () => set(initialState),
  })
)
