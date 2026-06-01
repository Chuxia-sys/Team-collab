'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { MessageSquare, Eye, EyeOff, AlertCircle, Zap, Shield, Users, ArrowRight, Check } from 'lucide-react'

const leftPanelFeatures = [
  { icon: Zap, text: 'Real-time collaboration across all tools' },
  { icon: Shield, text: 'Enterprise-grade security & privacy' },
  { icon: Users, text: 'Built for teams of any size' },
]

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500' }
  if (score <= 3) return { level: 2, label: 'Medium', color: 'bg-amber-500' }
  return { level: 3, label: 'Strong', color: 'bg-emerald-500' }
}

export function RegisterView() {
  const { register, isLoading, error, clearError } = useAuthStore()
  const { navigate } = useUIStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

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

    if (!agreedToTerms) {
      setLocalError('You must agree to the terms of service')
      return
    }

    await register(email, password, name)
  }

  const displayError = localError || error

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
              Start your journey with TeamCollab
            </motion.h2>
            <motion.p
              className="text-white/60 text-lg mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Create a free account and start collaborating with your team in minutes. No credit card required.
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

      {/* Right Panel - Register Form */}
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
                    className="h-11"
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
                    className="h-11"
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
                      className="h-11 pr-10"
                      minLength={6}
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
                  {/* Password Strength Indicator */}
                  {password && (
                    <motion.div
                      className="space-y-1.5"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              passwordStrength.level >= level
                                ? passwordStrength.color
                                : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        passwordStrength.level === 1 ? 'text-red-500' :
                        passwordStrength.level === 2 ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {passwordStrength.label} password
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pr-10"
                      minLength={6}
                    />
                    {confirmPassword && confirmPassword === password && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Check className="size-4 text-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground cursor-pointer leading-snug">
                    I agree to the{' '}
                    <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading || !name || !email || !password || !confirmPassword || !agreedToTerms}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating account...
                    </div>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 size-4" />
                    </>
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
    </div>
  )
}
