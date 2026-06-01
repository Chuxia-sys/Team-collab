'use client'

import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  MessageSquare,
  FileText,
  Table2,
  Presentation,
  ListTodo,
  Users,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Globe,
  Heart,
  Building2,
  Rocket,
} from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'Messaging',
    description: 'Real-time messaging with channels, threads, and pinned messages.',
    color: 'bg-emerald-500/10 text-emerald-600',
    hoverColor: 'group-hover:bg-emerald-500 group-hover:text-white',
  },
  {
    icon: FileText,
    title: 'Documents',
    description: 'Collaborative document editing with version history and tags.',
    color: 'bg-teal-500/10 text-teal-600',
    hoverColor: 'group-hover:bg-teal-500 group-hover:text-white',
  },
  {
    icon: Table2,
    title: 'Spreadsheets',
    description: 'Create and manage spreadsheets with your team in real-time.',
    color: 'bg-cyan-500/10 text-cyan-600',
    hoverColor: 'group-hover:bg-cyan-500 group-hover:text-white',
  },
  {
    icon: Presentation,
    title: 'Presentations',
    description: 'Build and deliver presentations together with your workspace.',
    color: 'bg-amber-500/10 text-amber-600',
    hoverColor: 'group-hover:bg-amber-500 group-hover:text-white',
  },
  {
    icon: ListTodo,
    title: 'Tasks',
    description: 'Kanban-style task boards with priorities, assignments, and due dates.',
    color: 'bg-rose-500/10 text-rose-600',
    hoverColor: 'group-hover:bg-rose-500 group-hover:text-white',
  },
  {
    icon: Users,
    title: 'Workspaces',
    description: 'Organized workspaces with roles, permissions, and invite codes.',
    color: 'bg-violet-500/10 text-violet-600',
    hoverColor: 'group-hover:bg-violet-500 group-hover:text-white',
  },
]

const highlights = [
  { icon: Zap, text: 'Lightning fast collaboration' },
  { icon: Shield, text: 'Secure and private workspaces' },
  { icon: Globe, text: 'Access anywhere, anytime' },
]

const trustedCompanies = [
  'Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Stark Industries', 'Wayne Enterprises',
]

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Floating shape component for hero background
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Floating circles */}
      <motion.div
        className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-white/5 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-white/5 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Small floating dots */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/20"
          style={{
            width: 4 + i * 2,
            height: 4 + i * 2,
            top: `${15 + i * 14}%`,
            left: `${10 + i * 15}%`,
          }}
          animate={{
            y: [0, -15 - i * 3, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  )
}

export function LandingView() {
  const { navigate } = useUIStore()
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/90 backdrop-blur-md shadow-sm border-b' : 'bg-transparent border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MessageSquare className="size-5" />
              </div>
              <span className="text-xl font-bold text-foreground">TeamCollab</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="#about" className="hover:text-foreground transition-colors">About</a>
              <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
            </nav>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate('login')}
                className="hover:bg-accent"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate('register')}
                className="bg-primary hover:bg-primary/90 shadow-sm"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        className="relative overflow-hidden bg-gradient-to-br from-primary via-[#2d6a1e] to-secondary"
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        <FloatingShapes />
        <motion.div
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-36 lg:py-44"
          style={{ opacity: heroOpacity }}
        >
          <motion.div className="text-center max-w-3xl mx-auto" variants={fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-sm font-medium text-white mb-8">
              <Rocket className="size-4" />
              Collaboration, reimagined
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
              Everything your team needs,{' '}
              <span className="text-white/80">in one place</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              TeamCollab brings messaging, documents, spreadsheets, presentations, and task management
              together in a single powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('register')}
                className="bg-white text-primary hover:bg-white/90 px-10 h-14 text-base font-semibold shadow-lg shadow-black/20 rounded-xl"
              >
                Start for Free
                <ArrowRight className="ml-2 size-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('login')}
                className="px-10 h-14 text-base border-white/30 text-white hover:bg-white/10 hover:text-white rounded-xl"
              >
                Sign In
              </Button>
            </div>
          </motion.div>

          {/* Highlights */}
          <motion.div
            className="mt-16 flex flex-wrap items-center justify-center gap-8"
            variants={fadeUp}
          >
            {highlights.map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-white/60">
                <item.icon className="size-4 text-white/80" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Trusted by Section */}
      <section className="py-12 bg-muted/30 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">
              Trusted by 2,500+ teams worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {trustedCompanies.map((company) => (
                <div key={company} className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  <Building2 className="size-5" />
                  <span className="text-sm font-semibold tracking-wide">{company}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Zap className="size-4" />
              Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              All the tools you need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From real-time chat to complex project management, TeamCollab has everything
              your team needs to be productive.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 group hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`flex size-14 items-center justify-center rounded-2xl ${feature.color} ${feature.hoverColor} transition-all duration-300 mb-5`}>
                      <feature.icon className="size-7" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary/5 via-accent to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '2,500+', label: 'Active Teams' },
              { value: '50K+', label: 'Messages Daily' },
              { value: '99.9%', label: 'Uptime' },
              { value: '4.9/5', label: 'User Rating' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="rounded-3xl bg-gradient-to-br from-primary via-[#2d6a1e] to-secondary p-10 sm:p-16 text-center relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Decorative shapes */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5 blur-2xl" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to transform your team?
              </h2>
              <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
                Join thousands of teams already using TeamCollab to work better together.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate('register')}
                  className="bg-white text-primary hover:bg-white/90 px-10 h-14 text-base font-semibold shadow-lg rounded-xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/60 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  Free to start
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  No credit card required
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  Unlimited workspaces
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="border-t bg-muted/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MessageSquare className="size-5" />
                </div>
                <span className="text-lg font-bold text-foreground">TeamCollab</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The all-in-one collaboration platform for modern teams.
              </p>
            </div>
            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Integrations', 'Changelog'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Company */}
            <div id="contact">
              <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2">
                {['Privacy', 'Terms', 'Security', 'GDPR'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 TeamCollab. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Made with <Heart className="size-3.5 text-red-500 mx-0.5" /> for teams everywhere
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
