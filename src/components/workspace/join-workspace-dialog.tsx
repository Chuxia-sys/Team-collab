'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Link2, Copy, Check } from 'lucide-react'

interface JoinWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoined?: () => void
}

export function JoinWorkspaceDialog({ open, onOpenChange, onJoined }: JoinWorkspaceDialogProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code')
      return
    }

    setError(null)
    setSuccess(null)
    setIsJoining(true)

    try {
      const res = await fetch('/api/workspaces/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to join workspace')
        return
      }

      setSuccess(data.message || 'Joined workspace successfully!')
      setInviteCode('')

      // Notify parent
      onJoined?.()

      // Close after brief delay
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(null)
      }, 1500)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setInviteCode('')
      setError(null)
      setSuccess(null)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-5 text-primary" />
            Join Workspace
          </DialogTitle>
          <DialogDescription>
            Enter an invite code to join an existing workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Info */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground">
              Ask a workspace owner or admin to share the invite code with you. You can find the invite code in Workspace Settings.
            </p>
          </div>

          {/* Invite Code Input */}
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <div className="relative">
              <Input
                id="invite-code"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value)
                  setError(null)
                }}
                placeholder="Paste invite code here..."
                className="h-10 pr-10 font-mono text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJoin()
                }}
              />
              {inviteCode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-8"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode)
                  }}
                >
                  <Copy className="size-3.5" />
                </Button>
              )}
            </div>
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

          {/* Success */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 text-sm text-emerald-600"
            >
              <Check className="size-4" />
              {success}
            </motion.div>
          )}

          {/* Join Button */}
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={handleJoin}
            disabled={isJoining || !inviteCode.trim()}
          >
            {isJoining ? (
              <div className="flex items-center gap-2">
                <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Joining...
              </div>
            ) : (
              <>
                <Link2 className="size-4 mr-2" />
                Join Workspace
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
