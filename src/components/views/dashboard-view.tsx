'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  MoreHorizontal,
  Users,
  MessageSquare,
  Trash2,
  LogOut,
  FolderOpen,
  LayoutDashboard,
  Hash,
  Clock,
  UserPlus,
  FileText,
  ListTodo,
} from 'lucide-react'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

// Generate a gradient color based on workspace name hash
function getGradientFromName(name: string): string {
  const gradients = [
    'from-emerald-400 to-emerald-600',
    'from-teal-400 to-teal-600',
    'from-cyan-400 to-cyan-600',
    'from-amber-400 to-amber-600',
    'from-rose-400 to-rose-600',
    'from-violet-400 to-violet-600',
    'from-orange-400 to-orange-600',
    'from-pink-400 to-pink-600',
    'from-lime-400 to-lime-600',
    'from-fuchsia-400 to-fuchsia-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

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

export function DashboardView() {
  const { user, logout } = useAuthStore()
  const { workspaces, loadWorkspaces, createWorkspace, deleteWorkspace, leaveWorkspace, isLoading } = useWorkspaceStore()
  const { navigate } = useUIStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [wsName, setWsName] = useState('')
  const [wsDescription, setWsDescription] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [leaveId, setLeaveId] = useState<string | null>(null)

  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  const handleCreate = async () => {
    if (!wsName.trim()) return
    const ws = await createWorkspace(wsName.trim(), wsDescription.trim() || undefined)
    if (ws) {
      setCreateOpen(false)
      setWsName('')
      setWsDescription('')
      navigate('workspace', { workspaceId: ws.id, subView: 'home' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteWorkspace(deleteId)
    setDeleteId(null)
  }

  const handleLeave = async () => {
    if (!leaveId) return
    await leaveWorkspace(leaveId)
    setLeaveId(null)
  }

  const handleOpenWorkspace = (workspaceId: string) => {
    navigate('workspace', { workspaceId, subView: 'home' })
  }

  const handleLogout = async () => {
    await logout()
    navigate('landing')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default' as const
      case 'admin': return 'secondary' as const
      default: return 'outline' as const
    }
  }

  // Compute stats
  const stats = useMemo(() => {
    const totalMembers = workspaces.reduce((acc, ws) => acc + (ws._count?.members ?? ws.members?.length ?? 0), 0)
    const totalChannels = workspaces.reduce((acc, ws) => acc + (ws._count?.channels ?? ws.channels?.length ?? 0), 0)
    return {
      workspaces: workspaces.length,
      members: totalMembers,
      channels: totalChannels,
    }
  }, [workspaces])

  // Generate mock recent activity based on workspaces
  const recentActivity = useMemo(() => {
    const activities: { icon: React.ElementType; text: string; time: string; color: string }[] = []
    workspaces.forEach((ws) => {
      const memberCount = ws._count?.members ?? ws.members?.length ?? 0
      const channelCount = ws._count?.channels ?? ws.channels?.length ?? 0
      activities.push({
        icon: FolderOpen,
        text: `Workspace "${ws.name}" was created`,
        time: getRelativeTime(ws.createdAt),
        color: 'text-emerald-500',
      })
      if (memberCount > 0) {
        activities.push({
          icon: UserPlus,
          text: `${memberCount} member${memberCount > 1 ? 's' : ''} joined "${ws.name}"`,
          time: getRelativeTime(ws.updatedAt),
          color: 'text-blue-500',
        })
      }
      if (channelCount > 0) {
        activities.push({
          icon: Hash,
          text: `${channelCount} channel${channelCount > 1 ? 's' : ''} created in "${ws.name}"`,
          time: getRelativeTime(ws.updatedAt),
          color: 'text-violet-500',
        })
      }
    })
    return activities.slice(0, 6)
  }, [workspaces])

  const statCards = [
    { icon: LayoutDashboard, label: 'Workspaces', value: stats.workspaces, color: 'bg-emerald-500/10 text-emerald-600' },
    { icon: Users, label: 'Total Members', value: stats.members, color: 'bg-blue-500/10 text-blue-600' },
    { icon: Hash, label: 'Total Channels', value: stats.channels, color: 'bg-violet-500/10 text-violet-600' },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MessageSquare className="size-5" />
              </div>
              <span className="text-lg font-bold">TeamCollab</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">{user?.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="size-4 mr-1.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Welcome */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Manage your workspaces and start collaborating with your team.
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
        >
          {statCards.map((stat) => (
            <motion.div key={stat.label} variants={fadeUp}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`flex size-12 items-center justify-center rounded-xl ${stat.color}`}>
                    <stat.icon className="size-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 shadow-sm">
                <Plus className="size-4 mr-2" />
                Create Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="My Workspace"
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="What is this workspace about?"
                    value={wsDescription}
                    onChange={(e) => setWsDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={!wsName.trim() || isLoading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isLoading ? 'Creating...' : 'Create Workspace'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Workspaces Grid */}
        {workspaces.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                  <FolderOpen className="size-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  Create your first workspace to start collaborating with your team. You can invite members and organize your projects.
                </p>
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="size-4 mr-2" />
                  Create Your First Workspace
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
            initial="initial"
            animate="animate"
            variants={{
              animate: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {workspaces.map((ws) => {
              const memberCount = ws._count?.members ?? ws.members?.length ?? 0
              const channelCount = ws._count?.channels ?? ws.channels?.length ?? 0
              const myRole = ws.members?.find((m) => m.userId === user?.id)?.role || 'member'
              const gradient = getGradientFromName(ws.name)
              const memberAvatars = ws.members?.slice(0, 4) || []

              return (
                <motion.div key={ws.id} variants={fadeUp}>
                  <Card
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/30 group hover:-translate-y-0.5"
                    onClick={() => handleOpenWorkspace(ws.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white text-sm font-bold shrink-0`}>
                            {getInitials(ws.name)}
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                              {ws.name}
                            </CardTitle>
                            {ws.description && (
                              <CardDescription className="text-xs line-clamp-1">
                                {ws.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            {myRole === 'owner' && (
                              <DropdownMenuItem
                                onClick={() => setDeleteId(ws.id)}
                                className="text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete Workspace
                              </DropdownMenuItem>
                            )}
                            {myRole !== 'owner' && (
                              <DropdownMenuItem
                                onClick={() => setLeaveId(ws.id)}
                                className="text-destructive focus:text-destructive cursor-pointer"
                              >
                                <LogOut className="size-4 mr-2" />
                                Leave Workspace
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="size-3.5" />
                          {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Hash className="size-3.5" />
                          {channelCount} {channelCount === 1 ? 'channel' : 'channels'}
                        </div>
                      </div>

                      {/* Member avatars row */}
                      {memberAvatars.length > 0 && (
                        <div className="flex items-center mb-3">
                          <div className="flex -space-x-2">
                            {memberAvatars.map((member) => (
                              <Avatar key={member.id} className="size-6 border-2 border-background">
                                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                  {member.user?.name ? getInitials(member.user.name) : '?'}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          {memberCount > 4 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              +{memberCount - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Badge variant={getRoleBadgeVariant(myRole)} className="capitalize text-xs">
                          {myRole}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {getRelativeTime(ws.updatedAt)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}

            {/* Create workspace card */}
            <motion.div variants={fadeUp}>
              <Card
                className="border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer h-full"
                onClick={() => setCreateOpen(true)}
              >
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                    <Plus className="size-6" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">New Workspace</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Recent Activity Section */}
        {workspaces.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <Card>
              <CardContent className="p-0">
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <Clock className="size-8 mb-2" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
                        <div className={`flex size-8 items-center justify-center rounded-lg bg-muted ${activity.color}`}>
                          <activity.icon className="size-4" />
                        </div>
                        <p className="text-sm text-foreground flex-1">{activity.text}</p>
                        <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workspace? This action cannot be undone.
              All channels, messages, documents, and tasks will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation */}
      <AlertDialog open={!!leaveId} onOpenChange={(open) => !open && setLeaveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this workspace? You will need a new invite to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} className="bg-destructive hover:bg-destructive/90">
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
