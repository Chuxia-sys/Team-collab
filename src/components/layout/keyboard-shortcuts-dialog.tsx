'use client'

import { useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useUIStore } from '@/stores/uiStore'
import {
  Search,
  MessageSquare,
  ArrowLeft,
  Settings,
  X,
  Command,
  HelpCircle,
  Hash,
  FileText,
  ListTodo,
  Users,
  Bell,
} from 'lucide-react'

interface ShortcutGroup {
  title: string
  icon: React.ElementType
  shortcuts: { keys: string[]; description: string }[]
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    icon: ArrowLeft,
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open search / command palette' },
      { keys: ['⌘', '/'], description: 'Show keyboard shortcuts' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close dialog / panel' },
    ],
  },
  {
    title: 'Workspace',
    icon: Hash,
    shortcuts: [
      { keys: ['⌘', '1'], description: 'Go to Home' },
      { keys: ['⌘', '2'], description: 'Go to Channels' },
      { keys: ['⌘', '3'], description: 'Go to Tasks' },
      { keys: ['⌘', '4'], description: 'Go to Documents' },
      { keys: ['⌘', '5'], description: 'Go to Members' },
      { keys: ['⌘', '6'], description: 'Go to Settings' },
    ],
  },
  {
    title: 'Messaging',
    icon: MessageSquare,
    shortcuts: [
      { keys: ['Enter'], description: 'Send message' },
      { keys: ['Shift', 'Enter'], description: 'New line in message' },
      { keys: ['Esc'], description: 'Cancel reply / edit' },
      { keys: ['↑'], description: 'Edit your last message' },
    ],
  },
  {
    title: 'Quick Actions',
    icon: Command,
    shortcuts: [
      { keys: ['⌘', 'N'], description: 'Create new channel' },
      { keys: ['⌘', 'Shift', 'N'], description: 'Create new document' },
      { keys: ['⌘', 'Shift', 'M'], description: 'Add member' },
      { keys: ['⌘', 'Shift', 'A'], description: 'View all notifications' },
    ],
  },
]

// Detect if user is on Mac
function isMac(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

// Format key for display
function formatKeys(keys: string[]): string[] {
  const mac = isMac()
  return keys.map((key) => {
    if (key === '⌘') return mac ? '⌘' : 'Ctrl'
    if (key === 'Shift' && mac) return '⇧'
    if (key === 'Esc') return 'Esc'
    return key
  })
}

export function KeyboardShortcutsDialog() {
  const { keyboardShortcutsOpen, setKeyboardShortcutsOpen } = useUIStore()

  // Listen for keyboard shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? key (without any modifier except shift for the ? character)
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Only trigger if not in an input/textarea
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }
        e.preventDefault()
        setKeyboardShortcutsOpen(!keyboardShortcutsOpen)
      }
      // Ctrl+/ or Cmd+/
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setKeyboardShortcutsOpen(!keyboardShortcutsOpen)
      }
      // Esc to close
      if (e.key === 'Escape' && keyboardShortcutsOpen) {
        setKeyboardShortcutsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [keyboardShortcutsOpen, setKeyboardShortcutsOpen])

  return (
    <Dialog open={keyboardShortcutsOpen} onOpenChange={setKeyboardShortcutsOpen}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="size-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and work faster
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6 max-h-[60vh]">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <div className="flex items-center gap-2 mb-3">
                <group.icon className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
              </div>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {formatKeys(shortcut.keys).map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md border border-border bg-muted font-mono text-xs font-medium text-foreground shadow-sm">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Separator />
        <div className="px-6 py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded border border-border bg-muted font-mono text-[10px] font-medium shadow-sm">
            ?
          </kbd>
          <span>or</span>
          <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded border border-border bg-muted font-mono text-[10px] font-medium shadow-sm">
            {isMac() ? '⌘' : 'Ctrl'}
          </kbd>
          <span>+</span>
          <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded border border-border bg-muted font-mono text-[10px] font-medium shadow-sm">
            /
          </kbd>
          <span>to toggle this panel</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
