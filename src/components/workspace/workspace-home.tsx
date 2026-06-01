'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useChannelStore } from '@/stores/channelStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  MessageSquare,
  FileText,
  Table2,
  Presentation,
  ListTodo,
  Plus,
  Hash,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const quickActions = [
  { icon: MessageSquare, label: 'New Message', subView: 'channel' as const, gradient: 'from-emerald-500 to-emerald-600', iconBg: 'bg-white/20' },
  { icon: FileText, label: 'New Document', subView: 'documents' as const, gradient: 'from-teal-500 to-teal-600', iconBg: 'bg-white/20' },
  { icon: Table2, label: 'New Spreadsheet', subView: 'spreadsheets' as const, gradient: 'from-cyan-500 to-cyan-600', iconBg: 'bg-white/20' },
  { icon: Presentation, label: 'New Presentation', subView: 'presentations' as const, gradient: 'from-amber-500 to-amber-600', iconBg: 'bg-white/20' },
]

const gettingStartedItems = [
  { icon: Hash, label: 'Create a channel', subView: 'home' as const, id: 'create-channel' },
  { icon: Users, label: 'Invite a member', subView: 'members' as const, id: 'invite-member' },
  { icon: FileText, label: 'Create a document', subView: 'documents' as const, id: 'create-doc' },
]

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function WorkspaceHome() {
  const { currentWorkspace, currentWorkspaceId, members, loadMembers } = useWorkspaceStore()
  const { channels, loadChannels, createChannel } = useChannelStore()
  const { navigate } = useUIStore()
  const { user } = useAuthStore()

  const [createChannelOpen, setCreateChannelOpen] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [channelDescription, setChannelDescription] = useState('')

  useEffect(() => {
    if (currentWorkspaceId) {
      loadChannels(currentWorkspaceId)
      loadMembers(currentWorkspaceId)
    }
  }, [currentWorkspaceId, loadChannels, loadMembers])

  // Compute completed steps from data directly (no useEffect needed)
  const completedSteps = useMemo(() => {
    const completed = new Set<string>()
    if (channels.length > 0) completed.add('create-channel')
    if (members.length > 1) completed.add('invite-member')
    return completed
  }, [channels.length, members.length])

  const handleCreateChannel = async () => {
    if (!currentWorkspaceId || !channelName.trim()) return
    const channel = await createChannel(currentWorkspaceId, {
      name: channelName.trim().toLowerCase().replace(/\s+/g, '-'),
      description: channelDescription.trim() || undefined,
    })
    if (channel) {
      setCreateChannelOpen(false)
      setChannelName('')
      setChannelDescription('')
      navigate('workspace', {
        workspaceId: currentWorkspaceId,
        subView: 'channel',
        channelId: channel.id,
      })
    }
  }

  const handleQuickAction = (subView: string) => {
    if (currentWorkspaceId) {
      navigate('workspace', {
        workspaceId: currentWorkspaceId,
        subView: subView as typeof currentSubView,
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const recentMembers = members.slice(0, 5)
  const currentSubView = useUIStore((s) => s.currentSubView)
  const allStepsCompleted = gettingStartedItems.every((item) => completedSteps.has(item.id))

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }}>
        {/* Welcome Banner */}
        <motion.div variants={fadeUp} className="mb-8">
          <Card className="bg-gradient-to-br from-primary via-[#2d6a1e] to-secondary border-0 overflow-hidden relative">
            {/* Decorative shapes */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5 blur-2xl" />
            <CardContent className="p-6 sm:p-8 relative">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-5 text-white/80" />
                <span className="text-sm text-white/60 font-medium">Welcome to</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {currentWorkspace?.name || 'Workspace'}
              </h1>
              {currentWorkspace?.description ? (
                <p className="text-white/60 max-w-lg">
                  {currentWorkspace.description}
                </p>
              ) : (
                <p className="text-white/60 max-w-lg">
                  Start collaborating with your team by creating channels and inviting members.
                </p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-white/50">
                <div className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1.5">
                  <Hash className="size-4" />
                  {channels.length} channel{channels.length !== 1 ? 's' : ''}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp} className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <motion.div
                key={action.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="cursor-pointer border-0 overflow-hidden hover:shadow-lg transition-shadow group"
                  onClick={() => handleQuickAction(action.subView)}
                >
                  <CardContent className={`p-4 flex flex-col items-center text-center gap-2.5 bg-gradient-to-br ${action.gradient} text-white`}>
                    <div className={`flex size-10 items-center justify-center rounded-xl ${action.iconBg} group-hover:scale-110 transition-transform`}>
                      <action.icon className="size-5" />
                    </div>
                    <span className="text-xs font-medium text-white/90">{action.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Getting Started Checklist */}
        {!allStepsCompleted && (
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Getting Started
            </h2>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  {gettingStartedItems.map((item) => {
                    const isCompleted = completedSteps.has(item.id)
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                          isCompleted ? 'opacity-60' : 'hover:bg-accent'
                        }`}
                        onClick={() => {
                          if (!isCompleted) {
                            if (item.id === 'create-channel') {
                              setCreateChannelOpen(true)
                            } else {
                              handleQuickAction(item.subView)
                            }
                          }
                        }}
                      >
                        {isCompleted ? (
                          <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <CheckCircle2 className="size-4" />
                          </div>
                        ) : (
                          <div className="flex size-6 items-center justify-center rounded-full border-2 border-muted-foreground/30">
                            <Circle className="size-3 text-transparent" />
                          </div>
                        )}
                        <span className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {item.label}
                        </span>
                        {!isCompleted && (
                          <ArrowRight className="size-3.5 text-muted-foreground ml-auto" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Channels Section */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Channels
            </h2>
            <Dialog open={createChannelOpen} onOpenChange={setCreateChannelOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                  <Plus className="size-4 mr-1" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        placeholder="channel-name"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input
                      placeholder="What is this channel about?"
                      value={channelDescription}
                      onChange={(e) => setChannelDescription(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleCreateChannel}
                    disabled={!channelName.trim()}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Create Channel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {channels.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-8">
                <Hash className="size-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No channels yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateChannelOpen(true)}
                >
                  <Plus className="size-4 mr-1" />
                  Create Channel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer group transition-colors"
                  onClick={() => {
                    if (currentWorkspaceId) {
                      navigate('workspace', {
                        workspaceId: currentWorkspaceId,
                        subView: 'channel',
                        channelId: channel.id,
                      })
                    }
                  }}
                >
                  <Hash className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{channel.name}</span>
                    {channel.description && (
                      <p className="text-xs text-muted-foreground truncate">{channel.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {channel.isPrivate && (
                      <Badge variant="outline" className="text-[10px] h-5">Private</Badge>
                    )}
                    {/* Last activity indicator */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {getRelativeTime(channel.updatedAt)}
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Members Preview */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Members ({members.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary"
              onClick={() => {
                if (currentWorkspaceId) {
                  navigate('workspace', {
                    workspaceId: currentWorkspaceId,
                    subView: 'members',
                  })
                }
              }}
            >
              View All
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-wrap">
                {recentMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent cursor-pointer transition-colors"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {member.user?.name ? getInitials(member.user.name) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{member.user?.name}</span>
                  </div>
                ))}
                {members.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{members.length - 5} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
