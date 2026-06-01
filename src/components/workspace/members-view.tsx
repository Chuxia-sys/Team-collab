'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Crown,
  Trash2,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/hooks/use-toast';

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  owner: {
    label: 'Owner',
    icon: <Crown className="h-3.5 w-3.5" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  admin: {
    label: 'Admin',
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    color: 'bg-red-100 text-red-800 border-red-300',
  },
  moderator: {
    label: 'Moderator',
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  member: {
    label: 'Member',
    icon: <Shield className="h-3.5 w-3.5" />,
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  guest: {
    label: 'Guest',
    icon: <UserCog className="h-3.5 w-3.5" />,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
};

export function MembersView() {
  const { currentWorkspaceId } = useUIStore();
  const { members, workspaceRoles, loadMembers, inviteMember, updateMemberRole, removeMember, currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadMembers(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadMembers]);

  const currentUserRole = currentWorkspaceId ? workspaceRoles[user?.id || ''] : null;
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  const filteredMembers = members.filter((m) =>
    m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = async () => {
    if (!currentWorkspaceId || !inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await inviteMember(currentWorkspaceId, inviteEmail.trim(), inviteRole as 'admin' | 'moderator' | 'member' | 'guest');
      setInviteEmail('');
      setInviteRole('member');
      setInviteDialogOpen(false);
      toast({ title: 'Invitation sent', description: `Invited ${inviteEmail} to the workspace` });
    } catch {
      toast({ title: 'Error', description: 'Failed to send invitation' });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!currentWorkspaceId) return;
    try {
      await updateMemberRole(currentWorkspaceId, userId, newRole);
      toast({ title: 'Role updated', description: 'Member role has been updated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update role' });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentWorkspaceId) return;
    try {
      await removeMember(currentWorkspaceId, userId);
      toast({ title: 'Member removed', description: 'Member has been removed from the workspace' });
    } catch {
      toast({ title: 'Error', description: 'Failed to remove member' });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-xl font-bold">Members</h2>
          <p className="text-sm text-muted-foreground">{members.length} members</p>
        </div>
        {canManage && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="invite-email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="pl-9"
                      type="email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleInvite} disabled={!inviteEmail.trim() || isInviting}>
                  {isInviting ? 'Inviting...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Members List */}
      <ScrollArea className="flex-1 px-6 pb-6">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">
              {searchQuery ? 'No members found' : 'No members yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredMembers.map((member, index) => {
                const role = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                const isCurrentUser = member.userId === user?.id;
                const canModifyThisMember =
                  canManage &&
                  !isCurrentUser &&
                  member.role !== 'owner';

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15, delay: index * 0.02 }}
                  >
                    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user?.avatar || undefined} />
                        <AvatarFallback>
                          {(member.user?.name || '??').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {member.user?.name || 'Unknown User'}
                          </span>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-[10px]">
                              you
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {member.user?.email}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn('gap-1 text-xs', role.color)}
                      >
                        {role.icon}
                        {role.label}
                      </Badge>

                      {canModifyThisMember && (
                        <div className="flex items-center gap-1">
                          <Select
                            value={member.role}
                            onValueChange={(val) => handleRoleChange(member.userId, val)}
                          >
                            <SelectTrigger className="h-7 w-7 p-0 border-none">
                              <UserCog className="h-4 w-4 text-muted-foreground" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="guest">Guest</SelectItem>
                            </SelectContent>
                          </Select>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.user?.name} from this workspace?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveMember(member.userId)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
