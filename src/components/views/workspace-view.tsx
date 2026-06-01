'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { MembersPanel } from '@/components/layout/members-panel'
import { WorkspaceHome } from '@/components/workspace/workspace-home'
import { ChannelView } from '@/components/workspace/channel-view'
import { TasksView } from '@/components/workspace/tasks-view'
import { DocumentsView } from '@/components/workspace/documents-view'
import { DocumentEditView } from '@/components/workspace/document-edit-view'
import { SpreadsheetsView } from '@/components/workspace/spreadsheets-view'
import { SpreadsheetEditView } from '@/components/workspace/spreadsheet-edit-view'
import { PresentationsView } from '@/components/workspace/presentations-view'
import { PresentationEditView } from '@/components/workspace/presentation-edit-view'
import { MembersView } from '@/components/workspace/members-view'
import { NotificationsView } from '@/components/workspace/notifications-view'
import { SettingsView } from '@/components/workspace/settings-view'

export function WorkspaceView() {
  const { currentWorkspaceId, currentSubView, membersPanelOpen } = useUIStore()
  const { switchWorkspace } = useWorkspaceStore()

  useEffect(() => {
    if (currentWorkspaceId) {
      switchWorkspace(currentWorkspaceId)
    }
  }, [currentWorkspaceId, switchWorkspace])

  const renderSubView = () => {
    switch (currentSubView) {
      case 'home':
        return <WorkspaceHome />
      case 'channel':
        return <ChannelView />
      case 'tasks':
        return <TasksView />
      case 'documents':
        return <DocumentsView />
      case 'document-edit':
        return <DocumentEditView />
      case 'spreadsheets':
        return <SpreadsheetsView />
      case 'spreadsheet-edit':
        return <SpreadsheetEditView />
      case 'presentations':
        return <PresentationsView />
      case 'presentation-edit':
        return <PresentationEditView />
      case 'members':
        return <MembersView />
      case 'notifications':
        return <NotificationsView />
      case 'settings':
        return <SettingsView />
      default:
        return <WorkspaceHome />
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <AppHeader />
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-hidden">
              {renderSubView()}
            </main>
            {membersPanelOpen && <MembersPanel />}
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
