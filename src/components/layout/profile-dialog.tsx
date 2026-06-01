'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
              <Avatar className="size-20 ring-2 ring-offset-2 ring-primary/20">
                <AvatarImage src={undefined} alt={name} />
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
            <p className="text-sm text-muted-foreground">Choose an avatar color</p>
          </div>

          {/* Avatar Color Selection */}
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

          {/* Name Field */}
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              value={user?.email || ''}
              disabled
              className="h-10 bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

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
