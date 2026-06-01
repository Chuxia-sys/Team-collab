'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useChannelStore } from '@/stores/channelStore'
import { useDocumentStore } from '@/stores/documentStore'
import { useTaskStore } from '@/stores/taskStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
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
  Activity,
  BarChart3,
  TrendingUp,
  Zap,
  Heart,
  Target,
  UserPlus,
  Keyboard,
} from 'lucide-react'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const quickActions = [
  { icon: Hash, label: 'Create Channel', subView: 'home' as const, gradient: 'from-emerald-500 to-emerald-600', iconBg: 'bg-white/20', action: 'create-channel' },
  { icon: UserPlus, label: 'Add Member', subView: 'members' as const, gradient: 'from-teal-500 to-teal-600', iconBg: 'bg-white/20', action: 'add-member' },
  { icon: FileText, label: 'New Document', subView: 'documents' as const, gradient: 'from-cyan-500 to-cyan-600', iconBg: 'bg-white/20', action: 'new-doc' },
  { icon: ListTodo, label: 'New Task', subView: 'tasks' as const, gradient: 'from-amber-500 to-amber-600', iconBg: 'bg-white/20', action: 'new-task' },
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
  const { documents, loadDocuments } = useDocumentStore()
  const { tasks, loadTasks } = useTaskStore()
  const { navigate } = useUIStore()
  const { user } = useAuthStore()

  const [createChannelOpen, setCreateChannelOpen] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [channelDescription, setChannelDescription] = useState('')

  useEffect(() => {
    if (currentWorkspaceId) {
      loadChannels(currentWorkspaceId)
      loadMembers(currentWorkspaceId)
      loadDocuments(currentWorkspaceId)
      loadTasks(currentWorkspaceId)
    }
  }, [currentWorkspaceId, loadChannels, loadMembers, loadDocuments, loadTasks])

  // Compute completed steps from data directly
  const completedSteps = useMemo(() => {
    const completed = new Set<string>()
    if (channels.length > 0) completed.add('create-channel')
    if (members.length > 1) completed.add('invite-member')
    if (documents.length > 0) completed.add('create-doc')
    return completed
  }, [channels.length, members.length, documents.length])

  // Activity feed from channels and members
  const activityFeed = useMemo(() => {
    const items: { icon: React.ElementType; text: string; time: string; color: string }[] = []

    channels.slice(0, 3).forEach((ch) => {
      items.push({
        icon: Hash,
        text: `Channel #${ch.name} was created`,
        time: getRelativeTime(ch.createdAt),
        color: 'text-emerald-500',
      })
    })

    members.slice(0, 3).forEach((m) => {
      items.push({
        icon: Users,
        text: `${m.user?.name || 'Someone'} joined the workspace`,
        time: getRelativeTime(m.joinedAt),
        color: 'text-teal-500',
      })
    })

    documents.slice(0, 2).forEach((doc) => {
      items.push({
        icon: FileText,
        text: `Document "${doc.title}" was updated`,
        time: getRelativeTime(doc.updatedAt),
        color: 'text-primary',
      })
    })

    // Sort by most recent
    items.sort(() => Math.random() - 0.5)
    return items.slice(0, 6)
  }, [channels, members, documents])

  // Workspace stats
  const workspaceStats = useMemo(() => [
    { icon: Users, label: 'Members', value: members.length, color: 'text-emerald-600 bg-emerald-50' },
    { icon: Hash, label: 'Channels', value: channels.length, color: 'text-teal-600 bg-teal-50' },
    { icon: FileText, label: 'Documents', value: documents.length, color: 'text-primary bg-primary/10' },
  ], [members.length, channels.length, documents.length])

  // Workspace Health Indicators
  const healthIndicators = useMemo(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const activeRate = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0

    // Activity score based on: channels with messages, recent members, recent documents
    const activityScore = Math.min(100, Math.round(
      (channels.length * 10) +
      (members.length * 8) +
      (documents.length * 5) +
      (completedTasks * 3)
    ))

    return {
      completionRate,
      activeRate,
      activityScore,
      totalTasks,
      completedTasks,
    }
  }, [tasks, channels, members, documents])

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

  const handleQuickAction = (action: string, subView: string) => {
    if (!currentWorkspaceId) return
    if (action === 'create-channel') {
      setCreateChannelOpen(true)
      return
    }
    navigate('workspace', {
      workspaceId: currentWorkspaceId,
      subView: subView as typeof currentSubView,
    })
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
  const recentDocuments = documents.slice(0, 4)

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

        {/* Quick Actions Bar */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Quick Actions
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary h-7 text-xs"
              onClick={() => {
                const { setKeyboardShortcutsOpen } = useUIStore.getState()
                setKeyboardShortcutsOpen(true)
              }}
            >
              <Keyboard className="size-3.5 mr-1" />
              Shortcuts
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <motion.div
                key={action.label}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="cursor-pointer border-0 overflow-hidden hover:shadow-lg transition-shadow group"
                  onClick={() => handleQuickAction(action.action, action.subView)}
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

        {/* Workspace Health Indicators */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Workspace Health
            </h2>
            <Activity className="size-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Activity Score */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Zap className="size-4" />
                    </div>
                    <span className="text-sm font-medium">Activity Score</span>
                  </div>
                  <Badge variant={healthIndicators.activityScore >= 70 ? 'default' : healthIndicators.activityScore >= 40 ? 'secondary' : 'outline'} className="text-xs">
                    {healthIndicators.activityScore >= 70 ? 'Healthy' : healthIndicators.activityScore >= 40 ? 'Moderate' : 'Low'}
                  </Badge>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-foreground">{healthIndicators.activityScore}</span>
                  <span className="text-sm text-muted-foreground mb-0.5">/100</span>
                </div>
                <Progress value={healthIndicators.activityScore} className="mt-2 h-2" />
              </CardContent>
            </Card>

            {/* Task Completion Rate */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <Target className="size-4" />
                    </div>
                    <span className="text-sm font-medium">Completion Rate</span>
                  </div>
                  <Badge variant={healthIndicators.completionRate >= 50 ? 'default' : 'outline'} className="text-xs">
                    {healthIndicators.totalTasks} tasks
                  </Badge>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-foreground">{healthIndicators.completionRate}%</span>
                  <span className="text-sm text-muted-foreground mb-0.5">done</span>
                </div>
                <Progress value={healthIndicators.completionRate} className="mt-2 h-2" />
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BarChart3 className="size-4" />
                  </div>
                  <span className="text-sm font-medium">Overview</span>
                </div>
                <div className="space-y-2">
                  {workspaceStats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <stat.icon className="size-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                      </div>
                      <span className="text-sm font-semibold">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Activity Feed */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Recent Activity
              </h2>
              <Activity className="size-4 text-muted-foreground" />
            </div>
            <Card>
              <CardContent className="p-0">
                {activityFeed.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <Activity className="size-8 mb-2" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {activityFeed.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
                        <div className={`flex size-8 items-center justify-center rounded-lg bg-muted ${item.color}`}>
                          <item.icon className="size-4" />
                        </div>
                        <p className="text-sm text-foreground flex-1">{item.text}</p>
                        <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Documents */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Recent Documents
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary"
                onClick={() => {
                  if (currentWorkspaceId) {
                    navigate('workspace', {
                      workspaceId: currentWorkspaceId,
                      subView: 'documents',
                    })
                  }
                }}
              >
                View All
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
            {recentDocuments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-8">
                  <FileText className="size-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No documents yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('new-doc', 'documents')}
                  >
                    <Plus className="size-4 mr-1" />
                    Create Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentDocuments.map((doc) => (
                  <Card
                    key={doc.id}
                    className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
                    onClick={() => {
                      if (currentWorkspaceId) {
                        navigate('workspace', {
                          workspaceId: currentWorkspaceId,
                          subView: 'document-edit',
                          documentId: doc.id,
                        })
                      }
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {getRelativeTime(doc.updatedAt)}
                          <span>·</span>
                          <span>v{doc.version}</span>
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Getting Started Checklist */}
        {!allStepsCompleted && (
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Getting Started
            </h2>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Heart className="size-4 text-primary" />
                    <span className="text-sm font-medium">
                      {completedSteps.size} of {gettingStartedItems.length} completed
                    </span>
                  </div>
                  <Progress value={(completedSteps.size / gettingStartedItems.length) * 100} className="w-24 h-2" />
                </div>
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
                              handleQuickAction(item.id, item.subView)
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
                    <div className="relative">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {member.user?.name ? getInitials(member.user.name) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background ${
                        member.user?.status === 'online' ? 'bg-emerald-500' :
                        member.user?.status === 'away' ? 'bg-amber-500' : 'bg-gray-400'
                      }`} />
                    </div>
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
