'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Hash,
  Users,
  FileText,
  Table2,
  Presentation,
  CheckCircle2,
  UserPlus,
  MessageSquare,
  ArrowRight,
  Activity,
} from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'channel_created' | 'member_joined' | 'document_created' | 'spreadsheet_created' | 'presentation_created' | 'task_completed' | 'task_assigned' | 'message_sent'
  description: string
  userName: string
  timestamp: string
  metadata?: Record<string, unknown>
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const activityConfig: Record<ActivityItem['type'], { icon: React.ElementType; color: string; bgColor: string }> = {
  channel_created: { icon: Hash, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  member_joined: { icon: UserPlus, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  document_created: { icon: FileText, color: 'text-primary', bgColor: 'bg-primary/10' },
  spreadsheet_created: { icon: Table2, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  presentation_created: { icon: Presentation, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  task_completed: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50' },
  task_assigned: { icon: Users, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  message_sent: { icon: MessageSquare, color: 'text-sky-600', bgColor: 'bg-sky-50' },
}

interface ActivityFeedProps {
  workspaceId: string
}

export function ActivityFeed({ workspaceId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    loadActivities()
  }, [workspaceId])

  const loadActivities = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/activity`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const displayedActivities = showAll ? activities : activities.slice(0, 6)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Recent Activity
        </h2>
        <Activity className="size-4 text-muted-foreground" />
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="size-8 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-3/4 rounded bg-muted" />
                  </div>
                  <div className="h-3 w-12 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Activity className="size-8 mb-2" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                <div className="divide-y">
                  {displayedActivities.map((item, i) => {
                    const config = activityConfig[item.type]
                    const Icon = config?.icon || Activity
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className={`flex size-8 items-center justify-center rounded-lg shrink-0 ${config?.bgColor || 'bg-muted'}`}>
                          <Icon className={`size-4 ${config?.color || 'text-muted-foreground'}`} />
                        </div>
                        <p className="text-sm text-foreground flex-1 min-w-0">
                          <span className="font-medium">{item.userName}</span>{' '}
                          <span className="text-muted-foreground">{item.description}</span>
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">{getRelativeTime(item.timestamp)}</span>
                      </motion.div>
                    )
                  })}
                </div>
              </AnimatePresence>

              {activities.length > 6 && (
                <div className="border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-primary hover:text-primary h-9 rounded-none"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? 'Show Less' : `View All (${activities.length})`}
                    <ArrowRight className={`size-3.5 ml-1 transition-transform ${showAll ? 'rotate-[-90deg]' : 'rotate-0'}`} />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
