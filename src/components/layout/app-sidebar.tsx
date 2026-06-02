'use client'

import { useEffect, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useChannelStore } from '@/stores/channelStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { cn } from '@/lib/utils'
import { CreateChannelDialog } from '@/components/workspace/create-channel-dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Hash,
  FileText,
  Table2,
  Presentation,
  ListTodo,
  Bell,
  Users,
  Settings,
  Home,
  LogOut,
  ChevronDown,
  Plus,
  MessageSquare,
} from 'lucide-react'

export function AppSidebar() {
  const { currentWorkspaceId, currentSubView, currentChannelId, navigate } = useUIStore()
  const { user, logout } = useAuthStore()
  const { workspaces, currentWorkspace, members, loadMembers } = useWorkspaceStore()
  const { channels, loadChannels } = useChannelStore()
  const { unreadCount } = useNotificationStore()
  const { state } = useSidebar()

  const [channelsOpen, setChannelsOpen] = useState(true)
  const [collabOpen, setCollabOpen] = useState(true)
  const [createChannelOpen, setCreateChannelOpen] = useState(false)

  useEffect(() => {
    if (currentWorkspaceId) {
      loadChannels(currentWorkspaceId)
      loadMembers(currentWorkspaceId)
    }
  }, [currentWorkspaceId, loadChannels, loadMembers])

  const handleLogout = async () => {
    await logout()
    navigate('landing')
  }

  const handleNavClick = (subView: string, extraParams?: Record<string, string | null>) => {
    if (currentWorkspaceId) {
      navigate('workspace', {
        workspaceId: currentWorkspaceId,
        subView: subView as typeof currentSubView,
        ...extraParams,
      })
    }
  }

  const isActive = (subView: string, id?: string) => {
    if (id) return currentSubView === subView && currentChannelId === id
    return currentSubView === subView
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

  const workspaceRole = user ? members.find((m) => m.userId === user.id)?.role : null

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 border-b justify-center py-0 px-3">
        {currentWorkspace ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                isActive={currentSubView === 'home'}
                onClick={() => handleNavClick('home')}
                tooltip={currentWorkspace.name}
                className="hover:bg-sidebar-accent"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MessageSquare className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{currentWorkspace.name}</span>
                  {workspaceRole && (
                    <span className="truncate text-xs text-muted-foreground capitalize">{workspaceRole}</span>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageSquare className="size-4" />
            </div>
            {state === 'expanded' && (
              <span className="font-semibold text-sm">TeamCollab</span>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Dashboard"
                  onClick={() => navigate('dashboard')}
                >
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {currentWorkspaceId && (
          <>
            {/* Workspace Home */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive('home')}
                      tooltip="Home"
                      onClick={() => handleNavClick('home')}
                    >
                      <Home className="size-4" />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Channels */}
            <SidebarGroup>
              <Collapsible open={channelsOpen} onOpenChange={setChannelsOpen}>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="w-full hover:bg-sidebar-accent rounded-md">
                    <div className="flex items-center justify-between w-full">
                      <span>Channels</span>
                      <ChevronDown
                        className={cn(
                          'size-4 transition-transform',
                          channelsOpen && 'rotate-180'
                        )}
                      />
                    </div>
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {channels.map((channel) => (
                        <SidebarMenuItem key={channel.id}>
                          <SidebarMenuButton
                            isActive={isActive('channel', channel.id)}
                            tooltip={channel.name}
                            onClick={() =>
                              handleNavClick('channel', {
                                channelId: channel.id,
                              })
                            }
                          >
                            <Hash className="size-4" />
                            <span>{channel.name}</span>
                            {channel.isPrivate && (
                              <span className="ml-auto text-xs text-muted-foreground">🔒</span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          tooltip="Add Channel"
                          onClick={() => setCreateChannelOpen(true)}
                          className="text-muted-foreground"
                        >
                          <Plus className="size-4" />
                          <span>Add Channel</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Collaboration */}
            <SidebarGroup>
              <Collapsible open={collabOpen} onOpenChange={setCollabOpen}>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="w-full hover:bg-sidebar-accent rounded-md">
                    <div className="flex items-center justify-between w-full">
                      <span>Collaboration</span>
                      <ChevronDown
                        className={cn(
                          'size-4 transition-transform',
                          collabOpen && 'rotate-180'
                        )}
                      />
                    </div>
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={isActive('documents')}
                          tooltip="Documents"
                          onClick={() => handleNavClick('documents')}
                        >
                          <FileText className="size-4" />
                          <span>Documents</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={isActive('spreadsheets')}
                          tooltip="Spreadsheets"
                          onClick={() => handleNavClick('spreadsheets')}
                        >
                          <Table2 className="size-4" />
                          <span>Spreadsheets</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={isActive('presentations')}
                          tooltip="Presentations"
                          onClick={() => handleNavClick('presentations')}
                        >
                          <Presentation className="size-4" />
                          <span>Presentations</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Tasks, Notifications, Members, Settings */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive('tasks')}
                      tooltip="Tasks"
                      onClick={() => handleNavClick('tasks')}
                    >
                      <ListTodo className="size-4" />
                      <span>Tasks</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive('notifications')}
                      tooltip="Notifications"
                      onClick={() => handleNavClick('notifications')}
                    >
                      <Bell className="size-4" />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs h-5 min-w-5 flex items-center justify-center">
                          {unreadCount}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive('members')}
                      tooltip="Members"
                      onClick={() => handleNavClick('members')}
                    >
                      <Users className="size-4" />
                      <span>Members</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive('settings')}
                      tooltip="Settings"
                      onClick={() => handleNavClick('settings')}
                    >
                      <Settings className="size-4" />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1">
                <Avatar className="size-8">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                {state === 'expanded' && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                )}
                {state === 'expanded' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" />
                  </Button>
                )}
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>

      <CreateChannelDialog open={createChannelOpen} onOpenChange={setCreateChannelOpen} />
    </Sidebar>
  )
}
