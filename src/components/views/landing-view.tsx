'use client'

import { motion } from 'framer-motion'
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
} from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'Messaging',
    description: 'Real-time messaging with channels, threads, and pinned messages.',
  },
  {
    icon: FileText,
    title: 'Documents',
    description: 'Collaborative document editing with version history and tags.',
  },
  {
    icon: Table2,
    title: 'Spreadsheets',
    description: 'Create and manage spreadsheets with your team in real-time.',
  },
  {
    icon: Presentation,
    title: 'Presentations',
    description: 'Build and deliver presentations together with your workspace.',
  },
  {
    icon: ListTodo,
    title: 'Tasks',
    description: 'Kanban-style task boards with priorities, assignments, and due dates.',
  },
  {
    icon: Users,
    title: 'Workspaces',
    description: 'Organized workspaces with roles, permissions, and invite codes.',
  },
]

const highlights = [
  { icon: Zap, text: 'Lightning fast collaboration' },
  { icon: Shield, text: 'Secure and private workspaces' },
  { icon: Globe, text: 'Access anywhere, anytime' },
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

export function LandingView() {
  const { navigate } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MessageSquare className="size-5" />
              </div>
              <span className="text-xl font-bold text-foreground">TeamCollab</span>
            </div>
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
                className="bg-primary hover:bg-primary/90"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        className="relative overflow-hidden"
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <motion.div className="text-center max-w-3xl mx-auto" variants={fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Zap className="size-4" />
              Collaboration, reimagined
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Everything your team needs,{' '}
              <span className="text-primary">in one place</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              TeamCollab brings messaging, documents, spreadsheets, presentations, and task management
              together in a single powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('register')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-base"
              >
                Start for Free
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('login')}
                className="px-8 h-12 text-base"
              >
                Sign In
              </Button>
            </div>
          </motion.div>

          {/* Highlights */}
          <motion.div
            className="mt-16 flex flex-wrap items-center justify-center gap-6"
            variants={fadeUp}
          >
            {highlights.map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="size-4 text-primary" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
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
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50 hover:border-primary/30 group">
                  <CardContent className="p-6">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <feature.icon className="size-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-8 sm:p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to transform your team?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of teams already using TeamCollab to work better together.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('register')}
                className="bg-white text-primary hover:bg-white/90 px-8 h-12 text-base font-semibold"
              >
                Get Started Free
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-white/70 text-sm">
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
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <MessageSquare className="size-3.5" />
              </div>
              <span className="text-sm font-semibold text-foreground">TeamCollab</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer transition-colors">About</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Contact</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2026 TeamCollab. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
