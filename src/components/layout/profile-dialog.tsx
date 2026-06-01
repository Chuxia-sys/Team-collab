'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { UserCircle, Camera } from 'lucide-react'

const AVATAR_COLORS = [
  'bg-primary',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-lime-500',
  'bg-cyan-500',
]

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, updateProfile } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [selectedColor, setSelectedColor] = useState(() => {
    if (!user?.avatar) return 0
    const idx = AVATAR_COLORS.indexOf(user.avatar)
    return idx >= 0 ? idx : 0
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isGoogleUser = user?.authProvider === 'google'
  const hasPhotoURL = !!user?.photoURL

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty')
      return
    }
    setError(null)
    setIsSaving(true)
    try {
      await updateProfile({
        name: name.trim(),
        avatar: AVATAR_COLORS[selectedColor],
      })
      onOpenChange(false)
    } catch {
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Reset form when opening
      setName(user?.name || '')
      const idx = user?.avatar ? AVATAR_COLORS.indexOf(user.avatar) : 0
      setSelectedColor(idx >= 0 ? idx : 0)
      setError(null)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="size-5 text-primary" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your display name and avatar color.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-3">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Avatar className={`size-20 ${hasPhotoURL ? 'ring-4 ring-offset-2 bg-gradient-to-br from-primary/40 via-blue-400/30 to-emerald-400/30 p-0.5' : 'ring-2 ring-offset-2 ring-primary/20'}`}>
                <AvatarImage src={user?.photoURL || undefined} alt={name} className={hasPhotoURL ? 'rounded-full' : ''} />
                <AvatarFallback
                  className={`${AVATAR_COLORS[selectedColor]} text-white text-2xl font-bold`}
                >
                  {name ? getInitials(name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Camera className="size-3.5" />
              </div>
            </motion.div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {hasPhotoURL ? 'Google profile photo' : 'Choose an avatar color'}
              </p>
              {isGoogleUser && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30">
                  Google
                </Badge>
              )}
            </div>
          </div>

          {/* Avatar Color Selection - hide if Google user with photo */}
          {!(hasPhotoURL && isGoogleUser) && (
            <div className="flex flex-wrap justify-center gap-2">
              {AVATAR_COLORS.map((color, index) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    size-9 rounded-full ${color} transition-all
                    ${selectedColor === index
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'ring-1 ring-border hover:ring-2 hover:ring-primary/30'
                    }
                  `}
                  onClick={() => setSelectedColor(index)}
                  type="button"
                  aria-label={`Avatar color ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-2 hover:bg-accent/30 rounded-lg p-2 -m-2 transition-colors">
            <Label htmlFor="profile-name">Display Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="Enter your name"
              className="h-10"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2 hover:bg-accent/30 rounded-lg p-2 -m-2 transition-colors">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              value={user?.email || ''}
              disabled
              className="h-10 bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {/* Auth Provider Info */}
          {isGoogleUser && (
            <div className="rounded-lg bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/80 dark:from-blue-950/20 dark:via-muted/50 dark:to-emerald-950/20 p-4 border border-blue-100/50 dark:border-blue-900/30 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white dark:bg-muted shadow-sm">
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
                <div>
                  <span className="text-foreground font-medium">Signed in with Google</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Your account is linked to your Google profile</p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
