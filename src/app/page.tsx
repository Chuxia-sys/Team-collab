'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { LandingView } from '@/components/views/landing-view'
import { LoginView } from '@/components/views/login-view'
import { RegisterView } from '@/components/views/register-view'
import { DashboardView } from '@/components/views/dashboard-view'
import { WorkspaceView } from '@/components/views/workspace-view'
import { CommandPalette } from '@/components/layout/command-palette'
import { ProfileDialog } from '@/components/layout/profile-dialog'
import { KeyboardShortcutsDialog } from '@/components/layout/keyboard-shortcuts-dialog'

export default function Home() {
  const { initialized, user } = useAuthStore()
  const { currentView, profileDialogOpen, setProfileDialogOpen } = useUIStore()

  // Initialize auth on mount
  useEffect(() => {
    useAuthStore.getState().initialize()
  }, [])

  // Show loading while auth is initializing
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading TeamCollab...</span>
          </div>
        </div>
      </div>
    )
  }

  // Not logged in views
  if (!user) {
    switch (currentView) {
      case 'login':
        return <LoginView />
      case 'register':
        return <RegisterView />
      case 'landing':
      default:
        return <LandingView />
    }
  }

  // Logged in views - with global dialogs
  return (
    <>
      {currentView === 'workspace' ? <WorkspaceView /> : <DashboardView />}
      <CommandPalette />
      <ProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
      <KeyboardShortcutsDialog />
    </>
  )
}
