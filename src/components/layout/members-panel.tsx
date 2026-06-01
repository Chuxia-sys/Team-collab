'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import { X, Search, UserPlus, Shield, Crown, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_BADGE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-700 border-amber-200',
  admin: 'bg-red-100 text-red-700 border-red-200',
  moderator: 'bg-sky-100 text-sky-700 border-sky-200',
  member: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  guest: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function MembersPanel() {
  const { members, currentWorkspace, inviteMember } = useWorkspaceStore()
  const { user } = useAuthStore()
  const { membersPanelOpen, setMembersPanelOpen } = useUIStore()
  const currentWorkspaceId = useUIStore((s) => s.currentWorkspaceId)

  const [searchQuery, setSearchQuery] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)

  const filteredMembers = members.filter((m) =>
    m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onlineMembers = filteredMembers.filter((m) => m.user?.status === 'online')
  const awayMembers = filteredMembers.filter((m) => m.user?.status === 'away' || m.user?.status === 'busy')
  const offlineMembers = filteredMembers.filter((m) => m.user?.status === 'offline' || !m.user?.status)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="size-3 text-amber-500" />
      case 'admin': return <Shield className="size-3 text-primary" />
      default: return null
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'online': return 'Online'
      case 'away': return 'Away'
      case 'busy': return 'Busy'
      default: return 'Offline'
    }
  }

  const handleInvite = async () => {
    if (!currentWorkspaceId || !inviteEmail) return
    setInviteLoading(true)
    try {
      await inviteMember(currentWorkspaceId, inviteEmail, inviteRole as 'admin' | 'moderator' | 'member' | 'guest')
      setInviteEmail('')
      setInviteRole('member')
      setInviteOpen(false)
    } finally {
      setInviteLoading(false)
    }
  }

  const isOwnerOrAdmin = members.find(
    (m) => m.userId === user?.id && (m.role === 'owner' || m.role === 'admin')
  )

  if (!membersPanelOpen) return null

  const renderMemberRow = (member: typeof members[0], dimmed = false) => (
    <TooltipProvider key={member.id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-all duration-150',
              'hover:bg-primary/5 hover:shadow-sm',
              dimmed && 'opacity-50'
            )}
          >
            <div className="relative shrink-0">
              <Avatar className="size-9 ring-2 ring-background">
                <AvatarImage src={member.user?.avatar || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {member.user?.name ? getInitials(member.user.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                'absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-background',
                getStatusColor(member.user?.status)
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">
                  {member.user?.name}
                  {member.userId === user?.id && (
                    <span className="text-muted-foreground font-normal"> (you)</span>
                  )}
                </span>
                {getRoleIcon(member.role)}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] h-4 px-1.5 capitalize border',
                    ROLE_BADGE_COLORS[member.role] || ROLE_BADGE_COLORS.member
                  )}
                >
                  {member.role}
                </Badge>
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Circle className={cn('size-1.5 fill-current', getStatusColor(member.user?.status).replace('bg-', 'text-'))} />
                  {getStatusLabel(member.user?.status)}
                </span>
              </div>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          <p>{member.user?.email}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div className="w-72 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Members</h3>
        <div className="flex items-center gap-1">
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              {isOwnerOrAdmin && (
                <Button variant="ghost" size="icon" className="size-7 hover:bg-primary/10">
                  <UserPlus className="size-4" />
                </Button>
              )}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail || inviteLoading}
                  className="w-full"
                >
                  {inviteLoading ? 'Inviting...' : 'Send Invite'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 hover:bg-primary/10"
            onClick={() => setMembersPanelOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/40 border-muted-foreground/20 focus:bg-background focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* Members list */}
      <ScrollArea className="flex-1">
        <div className="px-3 pb-3">
          {/* Online */}
          <AnimatePresence>
            {onlineMembers.length > 0 && (
              <motion.div
                className="mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-[11px] font-bold tracking-wider text-green-600">ONLINE</span>
                  <Separator className="flex-1 bg-green-200" />
                  <span className="text-[10px] font-medium text-muted-foreground">{onlineMembers.length}</span>
                </div>
                <div className="space-y-0.5">
                  {onlineMembers.map((member) => renderMemberRow(member))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Away / Busy */}
          <AnimatePresence>
            {awayMembers.length > 0 && (
              <motion.div
                className="mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-[11px] font-bold tracking-wider text-yellow-600">AWAY</span>
                  <Separator className="flex-1 bg-yellow-200" />
                  <span className="text-[10px] font-medium text-muted-foreground">{awayMembers.length}</span>
                </div>
                <div className="space-y-0.5">
                  {awayMembers.map((member) => renderMemberRow(member, true))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Offline */}
          <AnimatePresence>
            {offlineMembers.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-[11px] font-bold tracking-wider text-gray-500">OFFLINE</span>
                  <Separator className="flex-1 bg-gray-200" />
                  <span className="text-[10px] font-medium text-muted-foreground">{offlineMembers.length}</span>
                </div>
                <div className="space-y-0.5">
                  {offlineMembers.map((member) => renderMemberRow(member, true))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {searchQuery ? 'No members found' : 'No members yet'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
