'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import {
  MessageSquare,
  Users,
  FileText,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Hash,
  ListTodo,
} from 'lucide-react'

interface WorkspaceStats {
  messagesThisWeek: number
  messagesTrend: number
  activeMembers: number
  activeMembersTrend: number
  documentsThisWeek: number
  documentsTrend: number
  tasksCompletedThisWeek: number
  tasksCompletedTrend: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  totalMembers: number
  totalChannels: number
  totalDocuments: number
  channelActivity: { id: string; name: string; messageCount: number }[]
}

// Animated number counter component
function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const startValue = prevValue.current
    const endValue = value
    const startTime = Date.now()
    const animDuration = duration * 1000

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animDuration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(startValue + (endValue - startValue) * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
    prevValue.current = value

    return () => {
      prevValue.current = endValue
    }
  }, [value, duration])

  return <>{displayValue}</>
}

// Trend indicator component
function TrendIndicator({ trend }: { trend: number }) {
  if (trend === 0) return null

  const isUp = trend > 0
  return (
    <div className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
      {isUp ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      <span>{isUp ? '+' : ''}{trend}%</span>
    </div>
  )
}

interface WorkspaceStatsGridProps {
  workspaceId: string
}

export function WorkspaceStatsGrid({ workspaceId }: WorkspaceStatsGridProps) {
  const [stats, setStats] = useState<WorkspaceStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [workspaceId])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/stats`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  }

  if (isLoading) {
    return (
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Workspace Stats
          </h2>
          <BarChart3 className="size-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="size-8 rounded-lg bg-muted" />
                  <div className="h-6 w-12 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      icon: MessageSquare,
      label: 'Messages This Week',
      value: stats.messagesThisWeek,
      trend: stats.messagesTrend,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Users,
      label: 'Active Members',
      value: stats.activeMembers,
      trend: stats.activeMembersTrend,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      icon: FileText,
      label: 'New Documents',
      value: stats.documentsThisWeek,
      trend: stats.documentsTrend,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: CheckCircle2,
      label: 'Tasks Completed',
      value: stats.tasksCompletedThisWeek,
      trend: stats.tasksCompletedTrend,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Workspace Stats
        </h2>
        <BarChart3 className="size-4 text-muted-foreground" />
      </div>

      {/* Main stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`flex size-8 items-center justify-center rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`size-4 ${stat.color}`} />
                  </div>
                  <TrendIndicator trend={stat.trend} />
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  <AnimatedCounter value={stat.value} />
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Overview row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <Users className="size-4" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums"><AnimatedCounter value={stats.totalMembers} duration={1} /></p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0">
                <Hash className="size-4" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums"><AnimatedCounter value={stats.totalChannels} duration={1} /></p>
                <p className="text-xs text-muted-foreground">Channels</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <FileText className="size-4" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums"><AnimatedCounter value={stats.totalDocuments} duration={1} /></p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Task progress bar */}
      {stats.totalTasks > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ListTodo className="size-4 text-primary" />
                  <span className="text-sm font-medium">Task Progress</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {stats.completedTasks}/{stats.totalTasks} completed
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
                {stats.completedTasks > 0 && (
                  <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
                    transition={{ delay: 0.9, duration: 0.8, ease: 'easeOut' }}
                  />
                )}
                {stats.inProgressTasks > 0 && (
                  <motion.div
                    className="h-full bg-amber-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.inProgressTasks / stats.totalTasks) * 100}%` }}
                    transition={{ delay: 1.0, duration: 0.8, ease: 'easeOut' }}
                  />
                )}
                {stats.todoTasks > 0 && (
                  <motion.div
                    className="h-full bg-primary/30"
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.todoTasks / stats.totalTasks) * 100}%` }}
                    transition={{ delay: 1.1, duration: 0.8, ease: 'easeOut' }}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-green-500" />
                  Done ({stats.completedTasks})
                </div>
                <div className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-amber-400" />
                  In Progress ({stats.inProgressTasks})
                </div>
                <div className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-primary/30" />
                  To Do ({stats.todoTasks})
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Channel activity breakdown */}
      {stats.channelActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="mt-4"
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="size-4 text-primary" />
                <span className="text-sm font-medium">Channel Activity (This Week)</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {stats.channelActivity
                  .sort((a, b) => b.messageCount - a.messageCount)
                  .map((ch) => {
                    const maxMessages = Math.max(...stats.channelActivity.map((c) => c.messageCount), 1)
                    const widthPercent = (ch.messageCount / maxMessages) * 100
                    return (
                      <div key={ch.id} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-20 truncate shrink-0">#{ch.name}</span>
                        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full bg-primary/60 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPercent}%` }}
                            transition={{ delay: 1, duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="text-xs font-medium tabular-nums w-8 text-right shrink-0">{ch.messageCount}</span>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
