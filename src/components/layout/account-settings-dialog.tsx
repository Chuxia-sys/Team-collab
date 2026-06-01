'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
} from '@/components/ui/alert-dialog'
import {
  Shield,
  Mail,
  Calendar,
  Trash2,
  Link2,
  User,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

interface AccountSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountSettingsDialog({ open, onOpenChange }: AccountSettingsDialogProps) {
  const { user, loginWithGoogle, logout } = useAuthStore()
  const [isLinking, setIsLinking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLinkGoogle = async () => {
    setIsLinking(true)
    try {
      await loginWithGoogle()
      toast({ title: 'Google account linked', description: 'Your Google account has been linked successfully.' })
    } catch {
      toast({ title: 'Failed to link', description: 'Could not link your Google account.', variant: 'destructive' })
    } finally {
      setIsLinking(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({ title: 'Account deleted', description: 'Your account has been permanently deleted.' })
        await logout()
        onOpenChange(false)
      } else {
        const data = await res.json()
        toast({ title: 'Failed to delete', description: data.error || 'Could not delete account.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to delete', description: 'Network error. Please try again.', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  const createdAt = user?.createdAt ? new Date(user.createdAt) : new Date()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Account Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account settings and authentication methods
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Profile Section */}
          <div className="flex items-center gap-4">
            <Avatar className={`size-14 ${user?.photoURL ? 'ring-2 ring-primary/30 ring-offset-2' : ''}`}>
              <AvatarImage src={user?.photoURL || undefined} alt={user?.name || ''} />
              <AvatarFallback className={`${user?.avatar || 'bg-primary'} text-white text-lg`}>
                {user ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-base">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Separator />

          {/* Authentication Method */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Authentication Method</Label>

            {user?.authProvider === 'google' ? (
              <Card className="border-primary/20 bg-gradient-to-br from-blue-50/50 via-white to-emerald-50/50 dark:from-blue-950/20 dark:via-background dark:to-emerald-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-white shadow-sm border border-border/50">
                      <GoogleIcon className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Linked with Google</p>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30">
                          Active
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sign in with your Google account
                      </p>
                    </div>
                  </div>
                  {user.photoURL && (
                    <p className="text-xs text-muted-foreground mt-3 pl-[52px]">
                      Profile photo synced from Google
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="size-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Email & Password</p>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          Active
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sign in with email and password
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GoogleIcon className="size-4" />
                      <span className="text-sm">Link Google Account</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLinkGoogle}
                      disabled={isLinking}
                      className="gap-1.5"
                    >
                      {isLinking ? (
                        <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Link2 className="size-3.5" />
                      )}
                      {isLinking ? 'Linking...' : 'Link'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Account Details */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Account Details</Label>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Member since:</span>
                <span className="font-medium">{format(createdAt, 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono text-xs text-muted-foreground">{user?.id?.slice(0, 12)}...</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-destructive">Danger Zone</Label>
            <Card className="border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Delete Account</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isDeleting}
                        className="gap-1.5"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your
                          account and remove all your data from our servers, including
                          workspaces, messages, documents, and tasks you created.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Account'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
