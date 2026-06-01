'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Star,
  Quote,
  Mail,
  Github,
  Twitter,
  Linkedin,
  ChevronRight,
  TrendingUp,
  Award,
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

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Engineering Lead',
    company: 'Acme Corp',
    avatar: 'SC',
    avatarColor: 'bg-emerald-500',
    quote: 'TeamCollab transformed how our distributed team communicates. We went from 5 different tools to just one.',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Product Manager',
    company: 'Globex',
    avatar: 'MJ',
    avatarColor: 'bg-teal-500',
    quote: 'The task management and document collaboration features are incredible. Our sprint velocity increased by 40%.',
    rating: 5,
  },
  {
    name: 'Elena Rodriguez',
    role: 'Design Director',
    company: 'Initech',
    avatar: 'ER',
    avatarColor: 'bg-amber-500',
    quote: 'Finally, a tool that designers and developers both love. The presentation mode is a game-changer for design reviews.',
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'CTO',
    company: 'Umbrella',
    avatar: 'DK',
    avatarColor: 'bg-rose-500',
    quote: 'Security was our top concern. TeamCollab\'s workspace isolation and role-based access gave us confidence.',
    rating: 5,
  },
  {
    name: 'Lisa Wang',
    role: 'Team Lead',
    company: 'Stark Industries',
    avatar: 'LW',
    avatarColor: 'bg-violet-500',
    quote: 'We onboarded 50 team members in a day. The invite system and workspace structure made it effortless.',
    rating: 5,
  },
  {
    name: 'James Mitchell',
    role: 'Founder',
    company: 'Wayne Enterprises',
    avatar: 'JM',
    avatarColor: 'bg-cyan-500',
    quote: 'The best team collaboration tool we\'ve used. It just works, and the real-time features are rock solid.',
    rating: 5,
  },
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

// Animated counter component
function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (!isInView) return
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(interval)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(interval)
  }, [isInView, target])

  return (
    <div ref={ref} className="text-3xl sm:text-4xl font-bold text-primary mb-1">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  )
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
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
    }
  }

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
              <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
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

      {/* Trusted by Section - With Animated Counter */}
      <section className="py-12 bg-muted/30 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">
              Trusted by teams worldwide
            </p>
            {/* Animated counter */}
            <div className="mb-8">
              <AnimatedCounter target={2500} suffix="+" />
              <p className="text-sm text-muted-foreground">teams already collaborating</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {trustedCompanies.map((company, i) => (
                <motion.div
                  key={company}
                  className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Building2 className="size-5" />
                  <span className="text-sm font-semibold tracking-wide">{company}</span>
                </motion.div>
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

      {/* Stats Section with Animated Counters */}
      <section className="py-16 bg-gradient-to-r from-primary/5 via-accent to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { target: 2500, suffix: '+', label: 'Active Teams', icon: Users },
              { target: 50000, suffix: '+', label: 'Messages Daily', icon: MessageSquare },
              { target: 99, suffix: '.9%', label: 'Uptime', icon: TrendingUp },
              { target: 49, suffix: '/5', label: 'User Rating', icon: Award },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex justify-center mb-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <stat.icon className="size-5" />
                  </div>
                </div>
                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Star className="size-4" />
              Loved by Teams
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What our users say
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Don&apos;t just take our word for it — hear from some of the teams already using TeamCollab.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="size-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <Quote className="size-8 text-primary/20 mb-3" />
                    <p className="text-sm text-foreground leading-relaxed mb-6">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <Avatar className="size-10">
                        <AvatarFallback className={`${testimonial.avatarColor} text-white text-xs font-semibold`}>
                          {testimonial.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role} at {testimonial.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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

      {/* Enhanced Footer */}
      <footer id="about" className="border-t bg-muted/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            {/* Brand + Newsletter */}
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MessageSquare className="size-5" />
                </div>
                <span className="text-lg font-bold text-foreground">TeamCollab</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                The all-in-one collaboration platform for modern teams. Work smarter, not harder.
              </p>
              {/* Newsletter Signup */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Stay updated</h4>
                {subscribed ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-3 py-2">
                    <CheckCircle2 className="size-4" />
                    You&apos;re subscribed!
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 text-sm h-9"
                      required
                    />
                    <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 shrink-0">
                      <Mail className="size-4 mr-1" />
                      Subscribe
                    </Button>
                  </form>
                )}
                <p className="text-xs text-muted-foreground">No spam. Unsubscribe anytime.</p>
              </div>
            </div>
            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2.5">
                {['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-1 group">
                      {item}
                      <ChevronRight className="size-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Company */}
            <div id="contact">
              <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2.5">
                {['About', 'Blog', 'Careers', 'Contact', 'Press Kit'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-1 group">
                      {item}
                      <ChevronRight className="size-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2.5">
                {['Privacy', 'Terms', 'Security', 'GDPR', 'Cookies'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-1 group">
                      {item}
                      <ChevronRight className="size-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social links & copyright */}
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 TeamCollab. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <a href="#" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Twitter className="size-4" />
                </a>
                <a href="#" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Github className="size-4" />
                </a>
                <a href="#" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Linkedin className="size-4" />
                </a>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Made with <Heart className="size-3.5 text-red-500 mx-0.5" /> for teams everywhere
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
