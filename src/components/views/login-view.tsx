'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { MessageSquare, Eye, EyeOff, AlertCircle, Zap, Shield, Users, ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const leftPanelFeatures = [
  { icon: Zap, text: 'Real-time collaboration across all tools' },
  { icon: Shield, text: 'Enterprise-grade security & privacy' },
  { icon: Users, text: 'Built for teams of any size' },
]

export function LoginView() {
  const { login, isLoading, error, clearError } = useAuthStore()
  const { navigate } = useUIStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    clearError()
  }, [clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
  }

  const handleForgotPassword = () => {
    toast({
      title: 'Password Reset',
      description: 'A password reset link has been sent to your email address.',
    })
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-[#2d6a1e] to-secondary overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-white/5 blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('landing')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white">
              <MessageSquare className="size-6" />
            </div>
            <span className="text-2xl font-bold text-white">TeamCollab</span>
          </motion.div>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <motion.h2
              className="text-4xl font-bold text-white mb-4 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Welcome back to your workspace
            </motion.h2>
            <motion.p
              className="text-white/60 text-lg mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Sign in to continue collaborating with your team. All your work, just a click away.
            </motion.p>
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {leftPanelFeatures.map((feature, i) => (
                <motion.div
                  key={feature.text}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
                    <feature.icon className="size-4 text-white/80" />
                  </div>
                  <span className="text-sm text-white/70">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Bottom */}
          <motion.p
            className="text-white/30 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            &copy; 2026 TeamCollab. All rights reserved.
          </motion.p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 sm:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 lg:hidden" />

        <motion.div
          className="relative w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Logo for mobile */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => navigate('landing')}>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <MessageSquare className="size-6" />
              </div>
              <span className="text-2xl font-bold text-foreground">TeamCollab</span>
            </div>
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

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
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 size-11 hover:bg-transparent"
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

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                    Remember me for 30 days
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Signing in...
                    </div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <button
                  onClick={() => navigate('register')}
                  className="text-primary hover:underline font-medium"
                >
                  Create one
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
