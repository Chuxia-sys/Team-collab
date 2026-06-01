'use client'

import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { X, Search, UserPlus, Shield, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const offlineMembers = filteredMembers.filter((m) => m.user?.status !== 'online')

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

  return (
    <div className="w-72 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Members</h3>
        <div className="flex items-center gap-1">
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              {isOwnerOrAdmin && (
                <Button variant="ghost" size="icon" className="size-7">
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
            className="size-7"
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
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Members list */}
      <ScrollArea className="flex-1">
        <div className="px-3 pb-3">
          {/* Online */}
          {onlineMembers.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                Online — {onlineMembers.length}
              </p>
              <div className="space-y-0.5">
                {onlineMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className="size-8">
                        <AvatarImage src={member.user?.avatar || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {member.user?.name ? getInitials(member.user.name) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background',
                        getStatusColor(member.user?.status)
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium truncate">
                          {member.user?.name}
                          {member.userId === user?.id && (
                            <span className="text-muted-foreground font-normal"> (you)</span>
                          )}
                        </span>
                        {getRoleIcon(member.role)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offline */}
          {offlineMembers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                Offline — {offlineMembers.length}
              </p>
              <div className="space-y-0.5">
                {offlineMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer opacity-60"
                  >
                    <div className="relative">
                      <Avatar className="size-8">
                        <AvatarImage src={member.user?.avatar || undefined} />
                        <AvatarFallback className="text-xs bg-muted">
                          {member.user?.name ? getInitials(member.user.name) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background',
                        getStatusColor(member.user?.status)
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium truncate">
                          {member.user?.name}
                          {member.userId === user?.id && (
                            <span className="text-muted-foreground font-normal"> (you)</span>
                          )}
                        </span>
                        {getRoleIcon(member.role)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredMembers.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              {searchQuery ? 'No members found' : 'No members yet'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
