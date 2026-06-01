'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Eye, EyeOff, AlertCircle } from 'lucide-react'

export function RegisterView() {
  const { register, isLoading, error, clearError } = useAuthStore()
  const { navigate } = useUIStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    clearError()
  }, [clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    await register(email, password, name)
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => navigate('landing')}>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MessageSquare className="size-6" />
            </div>
            <span className="text-2xl font-bold text-foreground">TeamCollab</span>
          </div>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Get started with TeamCollab for free</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {displayError && (
                <motion.div
                  className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{displayError}</span>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-10 pr-10"
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 size-10 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <Eye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-10"
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading || !name || !email || !password || !confirmPassword}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <button
                onClick={() => navigate('login')}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
