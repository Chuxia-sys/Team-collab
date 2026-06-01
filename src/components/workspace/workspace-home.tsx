'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const quickActions = [
  { icon: MessageSquare, label: 'New Message', subView: 'channel' as const, color: 'bg-green-500/10 text-green-600' },
  { icon: FileText, label: 'New Document', subView: 'documents' as const, color: 'bg-blue-500/10 text-blue-600' },
  { icon: Table2, label: 'New Spreadsheet', subView: 'spreadsheets' as const, color: 'bg-amber-500/10 text-amber-600' },
  { icon: Presentation, label: 'New Presentation', subView: 'presentations' as const, color: 'bg-purple-500/10 text-purple-600' },
]

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }}>
        {/* Welcome Section */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-5 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {currentWorkspace?.name || 'Workspace'}
            </h1>
          </div>
          {currentWorkspace?.description && (
            <p className="text-muted-foreground max-w-lg">
              {currentWorkspace.description}
            </p>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp} className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Card
                key={action.label}
                className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                onClick={() => handleQuickAction(action.subView)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className={`flex size-10 items-center justify-center rounded-xl ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="size-5" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

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
