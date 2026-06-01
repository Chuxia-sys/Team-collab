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
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  owner: { label: 'Owner', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-800 border-red-300' },
  moderator: { label: 'Moderator', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  member: { label: 'Member', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  guest: { label: 'Guest', color: 'bg-gray-100 text-gray-800 border-gray-300' },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3 },
  }),
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

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

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
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Workspace Settings</h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-2xl space-y-6 p-6">
          {/* Workspace Avatar & Name */}
          <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarImage src={currentWorkspace.avatar || undefined} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {getInitials(currentWorkspace.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{currentWorkspace.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(currentWorkspace.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* General Settings */}
          <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-primary" />
                  General
                </CardTitle>
                <CardDescription>Basic workspace information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Workspace name"
                    className="focus-visible:ring-primary/30"
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
                    className="focus-visible:ring-primary/30 resize-none"
                  />
                </div>
                {canEdit && (
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Invite Link */}
          <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="h-4 w-4 text-primary" />
                  Invite Link
                </CardTitle>
                <CardDescription>Share this link to invite new members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={currentWorkspace.inviteCode ? `Invite Code: ${currentWorkspace.inviteCode}` : 'No invite code available'}
                    readOnly
                    className="flex-1 bg-muted/50 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopyInviteLink}
                    className="gap-2 shrink-0"
                  >
                    {copiedInvite ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
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
              </CardContent>
            </Card>
          </motion.div>

          {/* Members */}
          <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-primary" />
                  Members ({members.length})
                </CardTitle>
                <CardDescription>Manage workspace members and roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {members.map((member) => {
                    const role = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                    const isCurrentUser = member.userId === user?.id;
                    const canModifyThisMember =
                      canManageMembers && !isCurrentUser && member.role !== 'owner';

                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.user?.avatar || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
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
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
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
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          {isOwner && (
            <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible">
              <Card className="border-destructive/40 shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-destructive/70">
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                    <div>
                      <p className="text-sm font-medium">Delete this workspace</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Permanently delete &ldquo;{currentWorkspace.name}&rdquo; and all its data. This cannot be undone.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2 shrink-0 ml-4">
                          <Trash2 className="h-4 w-4" />
                          Delete
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
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
