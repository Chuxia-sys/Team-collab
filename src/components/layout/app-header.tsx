'use client'

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
} from '@/components/ui/dropdown-menu'
import {
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Menu,
  Bell,
  Users,
  ChevronsUpDown,
  LogOut,
  LayoutDashboard,
  Settings,
  UserCircle,
  Search,
  Keyboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const { currentWorkspaceId, currentSubView, toggleMembersPanel, membersPanelOpen, navigate, setCommandPaletteOpen, setProfileDialogOpen } = useUIStore()
  const { user, logout } = useAuthStore()
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaceStore()
  const { unreadCount } = useNotificationStore()
  const { openMobile, setOpenMobile } = useSidebar()

  const handleLogout = async () => {
    await logout()
    navigate('landing')
  }

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    await switchWorkspace(workspaceId)
    navigate('workspace', { workspaceId, subView: 'home' })
  }

  const getInitials = (name: string) => {
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

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-3 md:px-4">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden size-9"
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
            <Button variant="ghost" className="gap-2 px-2 h-9 hover:bg-accent">
              <span className="font-semibold text-sm truncate max-w-[120px] sm:max-w-[200px]">
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

      {/* Sub view title */}
      {currentWorkspaceId && (
        <span className="hidden sm:inline text-sm text-muted-foreground">
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
      <Button
        variant="ghost"
        size="icon"
        className="size-9 relative"
        onClick={() => {
          if (currentWorkspaceId) {
            navigate('workspace', { workspaceId: currentWorkspaceId, subView: 'notifications' })
          }
        }}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 size-4 min-w-4 p-0 text-[10px] flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
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

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-9 p-0 rounded-full">
            <Avatar className="size-8">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user ? getInitials(user.name) : '?'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
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
