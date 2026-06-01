'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Save,
  Copy,
  Check,
  Trash2,
  Users,
  Shield,
  Link2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  owner: { label: 'Owner', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-800 border-red-300' },
  moderator: { label: 'Moderator', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  member: { label: 'Member', color: 'bg-green-100 text-green-800 border-green-300' },
  guest: { label: 'Guest', color: 'bg-gray-100 text-gray-800 border-gray-300' },
};

export function SettingsView() {
  const { currentWorkspaceId, navigate } = useUIStore();
  const {
    currentWorkspace,
    members,
    workspaceRoles,
    loadMembers,
    updateWorkspace,
    deleteWorkspace,
    updateMemberRole,
    removeMember,
  } = useWorkspaceStore();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadMembers(currentWorkspaceId);
    }
  }, [currentWorkspaceId, loadMembers]);

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name);
      setDescription(currentWorkspace.description);
    }
  }, [currentWorkspace]);

  const currentUserRole = currentWorkspaceId ? workspaceRoles[user?.id || ''] : null;
  const isOwner = currentUserRole === 'owner';
  const canEdit = isOwner || currentUserRole === 'admin';
  const canManageMembers = isOwner || currentUserRole === 'admin';

  const handleSave = async () => {
    if (!currentWorkspaceId) return;
    setIsSaving(true);
    try {
      await updateWorkspace(currentWorkspaceId, { name, description });
      toast({ title: 'Settings saved', description: 'Workspace settings have been updated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!currentWorkspace?.inviteCode) return;
    const link = `${window.location.origin}/invite/${currentWorkspace.inviteCode}`;
    await navigator.clipboard.writeText(link);
    setCopiedInvite(true);
    toast({ title: 'Link copied', description: 'Invite link has been copied to clipboard' });
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspaceId) return;
    try {
      await deleteWorkspace(currentWorkspaceId);
      navigate('landing');
      toast({ title: 'Workspace deleted', description: 'The workspace has been permanently deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete workspace' });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!currentWorkspaceId) return;
    try {
      await updateMemberRole(currentWorkspaceId, userId, newRole);
    } catch {
      toast({ title: 'Error', description: 'Failed to update role' });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentWorkspaceId) return;
    try {
      await removeMember(currentWorkspaceId, userId);
    } catch {
      toast({ title: 'Error', description: 'Failed to remove member' });
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Select a workspace to view settings</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">Workspace Settings</h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-2xl space-y-8 p-6">
          {/* General Settings */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-lg font-semibold mb-4">General</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Workspace name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-desc">Description</Label>
                <Textarea
                  id="workspace-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Describe your workspace"
                  rows={3}
                />
              </div>
              {canEdit && (
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              )}
            </div>
          </motion.section>

          <Separator />

          {/* Invite Link */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Invite Link
            </h3>
            <div className="flex items-center gap-2">
              <Input
                value={currentWorkspace.inviteCode ? `Invite Code: ${currentWorkspace.inviteCode}` : 'No invite code available'}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleCopyInviteLink}
                className="gap-2 shrink-0"
              >
                {copiedInvite ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Share this invite code with team members to join your workspace.
            </p>
          </motion.section>

          <Separator />

          {/* Members in Settings */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({members.length})
            </h3>
            <div className="space-y-2">
              {members.map((member) => {
                const role = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                const isCurrentUser = member.userId === user?.id;
                const canModifyThisMember =
                  canManageMembers && !isCurrentUser && member.role !== 'owner';

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user?.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {(member.user?.name || '??').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {member.user?.name || 'Unknown'}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-[10px]">
                            you
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                    </div>

                    {canModifyThisMember ? (
                      <div className="flex items-center gap-1">
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleRoleChange(member.userId, val)}
                        >
                          <SelectTrigger className="h-7 w-auto gap-1 border-none">
                            <Badge
                              variant="outline"
                              className={cn('text-[10px]', role.color)}
                            >
                              {role.label}
                            </Badge>
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
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove {member.user?.name} from this workspace?
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
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn('text-[10px]', role.color)}
                      >
                        {role.label}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Danger Zone */}
          {isOwner && (
            <>
              <Separator />
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-lg border border-destructive/30 p-6"
              >
                <h3 className="text-lg font-semibold text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete this workspace and all its data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Workspace
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &ldquo;{currentWorkspace.name}&rdquo; and all
                        associated data including channels, messages, documents, tasks, and more.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteWorkspace}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Workspace
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </motion.section>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
