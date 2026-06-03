'use client'

import { useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import {
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Menu,
  Users,
  ChevronsUpDown,
  LogOut,
  LayoutDashboard,
  Settings,
  UserCircle,
  Search,
  Keyboard,
  Shield,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationCenter } from './notification-center'

const statusOptions = [
  { value: 'online' as const, label: 'Online', emoji: '🟢', dotClass: 'bg-emerald-500' },
  { value: 'away' as const, label: 'Away', emoji: '🟡', dotClass: 'bg-amber-500' },
  { value: 'busy' as const, label: 'Busy', emoji: '🔴', dotClass: 'bg-red-500' },
  { value: 'offline' as const, label: 'Offline', emoji: '⚫', dotClass: 'bg-gray-400' },
]

export function AppHeader() {
  const { currentWorkspaceId, currentSubView, toggleMembersPanel, membersPanelOpen, navigate, setCommandPaletteOpen, setProfileDialogOpen, setAccountSettingsOpen } = useUIStore()
  const { user, logout, updateStatus } = useAuthStore()
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaceStore()
  const { unreadCount } = useNotificationStore()
  const { openMobile, setOpenMobile } = useSidebar()

  const [isDark, setIsDark] = useState(false)
  const [themeLoaded, setThemeLoaded] = useState(false)

  // Initialize from localStorage at render time (avoids effect setState warnings)
  if (!themeLoaded) {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    const isCurrentlyDark = saved === 'dark' || (saved !== 'light' && document.documentElement.classList.contains('dark'))
    if (isCurrentlyDark !== isDark) {
      setIsDark(isCurrentlyDark)
    }
    setThemeLoaded(true)
  }

  const toggleTheme = () => {
    const root = document.documentElement
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('landing')
  }

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    await switchWorkspace(workspaceId)
    navigate('workspace', { workspaceId, subView: 'home' })
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getSubViewTitle = () => {
    switch (currentSubView) {
      case 'home': return 'Home'
      case 'channel': return 'Channel'
      case 'tasks': return 'Tasks'
      case 'documents': return 'Documents'
      case 'document-edit': return 'Edit Document'
      case 'spreadsheets': return 'Spreadsheets'
      case 'spreadsheet-edit': return 'Edit Spreadsheet'
      case 'presentations': return 'Presentations'
      case 'presentation-edit': return 'Edit Presentation'
      case 'members': return 'Members'
      case 'notifications': return 'Notifications'
      case 'settings': return 'Settings'
      default: return ''
    }
  }

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone/.test(navigator.userAgent)

  const currentStatusOption = statusOptions.find((s) => s.value === user?.status) || statusOptions[0]

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-1 sm:gap-2 border-b bg-background/80 backdrop-blur-md px-2 sm:px-4">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden size-9 shrink-0"
        onClick={() => setOpenMobile(true)}
      >
        <Menu className="size-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>

      {/* Desktop sidebar trigger */}
      <div className="hidden md:flex">
        <SidebarTrigger className="-ml-1" />
      </div>

      {/* Workspace Switcher */}
      {currentWorkspaceId && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-1 sm:gap-2 px-1.5 sm:px-2 h-9 hover:bg-accent min-w-0">
              <span className="font-semibold text-sm truncate max-w-24 sm:max-w-40 lg:max-w-50">
                {currentWorkspace?.name || 'Workspace'}
              </span>
              <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {workspaces
              .filter((w) => w.id !== currentWorkspaceId)
              .map((w) => (
                <DropdownMenuItem
                  key={w.id}
                  onClick={() => handleWorkspaceSwitch(w.id)}
                  className="cursor-pointer"
                >
                  <span className="truncate">{w.name}</span>
                </DropdownMenuItem>
              ))}
            {workspaces.length > 1 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={() => navigate('dashboard')}
              className="cursor-pointer"
            >
              <LayoutDashboard className="size-4 mr-2" />
              All Workspaces
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Sub view title - hidden on small mobile */}
      {currentWorkspaceId && (
        <span className="hidden md:inline text-sm text-muted-foreground whitespace-nowrap">
          / {getSubViewTitle()}
        </span>
      )}

      <div className="flex-1" />

      {/* Search Button with shortcut hint */}
      <Button
        variant="outline"
        className="hidden md:flex items-center gap-2 h-9 px-3 text-muted-foreground hover:text-foreground bg-muted/50 border-0"
        onClick={() => setCommandPaletteOpen(true)}
      >
        <Search className="size-4" />
        <span className="text-sm">Search...</span>
        <Keyboard className="size-3" />
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          {isMac ? '⌘' : 'Ctrl'}K
        </kbd>
      </Button>

      {/* Mobile search toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden size-9"
        onClick={() => setCommandPaletteOpen(true)}
      >
        <Search className="size-4" />
      </Button>

      {/* Notifications */}
      <NotificationCenter />

      {/* Dark mode toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="size-9"
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>

      {/* Members panel toggle */}
      {currentWorkspaceId && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'size-9 hidden sm:flex',
            membersPanelOpen && 'bg-accent text-accent-foreground'
          )}
          onClick={toggleMembersPanel}
        >
          <Users className="size-4" />
        </Button>
      )}

      {/* User menu with status selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-9 p-0 rounded-full relative">
            <Avatar className={`size-8 ${user?.photoURL ? 'ring-2 ring-primary/30' : ''}`}>
              <AvatarImage src={user?.photoURL || undefined} alt={user?.name || ''} />
              <AvatarFallback className={`${user?.avatar || 'bg-primary'} text-white text-xs`}>
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            {/* Google icon badge for Google users */}
            {user?.authProvider === 'google' && (
              <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-white dark:bg-muted shadow-sm border border-border/50 flex items-center justify-center">
                <svg className="size-2.5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
            )}
            {/* Status dot on avatar (hidden for Google users to avoid overlap) */}
            {user?.authProvider !== 'google' && (
              <div className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background ${
                currentStatusOption.dotClass
              }`} />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{user?.name}</p>
              {user?.authProvider === 'google' && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30">
                  Google
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />

          {/* Status Selector */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2">Set Status</DropdownMenuLabel>
            {statusOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => updateStatus(option.value)}
                className={cn(
                  'cursor-pointer',
                  user?.status === option.value && 'bg-accent'
                )}
              >
                <span className="mr-2 text-sm">{option.emoji}</span>
                <span className="text-sm">{option.label}</span>
                {user?.status === option.value && (
                  <span className="ml-auto text-xs text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setAccountSettingsOpen(true)}
            className="cursor-pointer"
          >
            <Shield className="size-4 mr-2" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setProfileDialogOpen(true)}
            className="cursor-pointer"
          >
            <UserCircle className="size-4 mr-2" />
            Edit Profile
          </DropdownMenuItem>
          {currentWorkspaceId && (
            <DropdownMenuItem
              onClick={() => navigate('workspace', { workspaceId: currentWorkspaceId, subView: 'settings' })}
              className="cursor-pointer"
            >
              <Settings className="size-4 mr-2" />
              Workspace Settings
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => navigate('dashboard')}
            className="cursor-pointer"
          >
            <LayoutDashboard className="size-4 mr-2" />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="size-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
