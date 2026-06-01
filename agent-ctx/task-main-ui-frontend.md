# Task: Build TeamCollab Main Page and Layout Components

## Summary
Built all required files for the TeamCollab single-page application. The app uses Zustand stores for state management and shadcn/ui components for the UI.

## Files Created

1. **`/src/app/page.tsx`** - Main entry point
   - 'use client' component that initializes auth on mount
   - Renders different views based on auth state and uiStore.currentView
   - Shows loading spinner while auth initializes
   - Routes to Landing, Login, Register, Dashboard, or Workspace views

2. **`/src/components/layout/app-sidebar.tsx`** - Sidebar component
   - Uses shadcn/ui Sidebar with collapsible icon mode
   - Shows workspace name with role badge
   - Dashboard link, Home link
   - Collapsible Channels section with channel list and add channel button
   - Collapsible Collaboration section (Documents, Spreadsheets, Presentations)
   - Tasks, Notifications (with unread badge), Members, Settings
   - User info at footer with logout button
   - Mobile support via Sheet overlay

3. **`/src/components/layout/app-header.tsx`** - Header component
   - Mobile menu toggle + desktop sidebar trigger
   - Workspace switcher dropdown
   - Sub-view title breadcrumb
   - Search bar (responsive)
   - Notifications bell with unread count
   - Members panel toggle
   - User dropdown menu with settings/sign out

4. **`/src/components/layout/members-panel.tsx`** - Right side panel
   - Members list with online/offline sections
   - Avatar with status indicator
   - Role badges with icons (Crown for owner, Shield for admin)
   - Search members
   - Invite member dialog (owner/admin only)
   - Close button

5. **`/src/components/views/landing-view.tsx`** - Landing page
   - Green-themed hero with gradient backgrounds
   - Features grid (6 items: Messaging, Documents, Spreadsheets, Presentations, Tasks, Workspaces)
   - CTA section with gradient background
   - Sign In / Get Started buttons
   - Highlights section
   - Footer with links
   - Framer Motion animations

6. **`/src/components/views/login-view.tsx`** - Login form
   - Email + password inputs with show/hide toggle
   - Sign in button with loading state
   - Error display
   - "Don't have an account? Create one" link
   - Green themed with Card component

7. **`/src/components/views/register-view.tsx`** - Register form
   - Name + email + password + confirm password
   - Password validation (min 6 chars, match check)
   - Create Account button with loading state
   - Error display
   - "Already have an account? Sign in" link

8. **`/src/components/views/dashboard-view.tsx`** - Dashboard
   - Welcome header with user name
   - Create Workspace button with dialog
   - Workspace grid cards with name, description, member count, channel count, role badge
   - Delete/Leave workspace with confirmation dialogs
   - Empty state with create workspace form
   - +New Workspace card in grid

9. **`/src/components/views/workspace-view.tsx`** - Workspace container
   - SidebarProvider wrapper
   - AppSidebar + AppHeader layout
   - Main content + MembersPanel (conditional)
   - Sub-view router based on currentSubView
   - Placeholder components for all sub-views
   - Loads workspace data on mount

10. **`/src/components/workspace/workspace-home.tsx`** - Workspace home
    - Workspace name and description with sparkle icon
    - Quick action buttons (4 cards: New Message, Document, Spreadsheet, Presentation)
    - Channels section with list, create channel dialog
    - Members preview with avatars
    - View All members link

## Key Design Decisions
- Used `currentSubView` (not `workspaceSubView`) as that's the property name in uiStore
- Green theme via CSS variables already configured in globals.css
- All navigation uses `uiStore.navigate()` instead of Next.js router
- shadcn/ui Sidebar component with collapsible="icon" for sidebar
- framer-motion for landing page and dashboard animations
- Responsive design with mobile-first approach
