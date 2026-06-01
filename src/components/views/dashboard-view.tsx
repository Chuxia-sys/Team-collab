'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export function DashboardView() {
  const { user } = useAuthStore()
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MessageSquare className="size-5" />
              </div>
              <span className="text-lg font-bold">TeamCollab</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-muted-foreground">
            Manage your workspaces and start collaborating with your team.
          </p>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
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

              return (
                <motion.div key={ws.id} variants={fadeUp}>
                  <Card
                    className="hover:shadow-md transition-all cursor-pointer hover:border-primary/30 group"
                    onClick={() => handleOpenWorkspace(ws.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-10 rounded-lg bg-primary/10">
                            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-sm">
                              {getInitials(ws.name)}
                            </AvatarFallback>
                          </Avatar>
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
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="size-3.5" />
                          {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="size-3.5" />
                          {channelCount} {channelCount === 1 ? 'channel' : 'channels'}
                        </div>
                      </div>
                      <div className="mt-3">
                        <Badge variant={getRoleBadgeVariant(myRole)} className="capitalize text-xs">
                          {myRole}
                        </Badge>
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
