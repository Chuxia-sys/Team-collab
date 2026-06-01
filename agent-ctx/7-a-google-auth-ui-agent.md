# Task 7-a: Google Auth UI Agent

## Task: Restructure Login and Register pages, add Firebase Auth state persistence, add toast notifications

## Work Completed

### Login View Restructuring (`src/components/views/login-view.tsx`)
- Moved "Continue with Google" button from BEFORE the email/password form to AFTER the Sign In button
- New layout order: CardHeader → Email/Password form → Sign In button → Divider ("or") → Continue with Google button → "Don't have an account?" link
- Updated Google button styling: `border-border/80 hover:bg-accent/50 transition-all duration-200`
- Changed divider text from "or continue with email" to simple "or"
- Maintained all existing functionality (forgot password, remember me, show/hide password)

### Register View Restructuring (`src/components/views/register-view.tsx`)
- Moved "Continue with Google" button from BEFORE the email/password form to AFTER the Create Account button
- New layout order: CardHeader → Email/Password form → Create Account button → Divider ("or") → Continue with Google button → "Already have an account?" link
- Same updated Google button styling and divider text as Login view
- Maintained all existing functionality (password strength indicator, confirm password, terms checkbox)

### Toast Notifications Added to authStore (`src/stores/authStore.ts`)
- Added `import { toast } from '@/hooks/use-toast'` at top of authStore.ts
- **login**: Added `toast({ title: 'Welcome back!', description: 'Signed in as ${data.user.name}' })` on success
- **register**: Added `toast({ title: 'Account created!', description: 'Welcome to TeamCollab, ${data.user.name}!' })` on success
- **loginWithGoogle**: Added `toast({ title: 'Welcome back!', description: 'Signed in as ${data.user.name}' })` on success
- **loginWithGoogle errors**: Added `variant: 'destructive'` toasts for: Firebase not configured, Google sign-in failed, popup blocked, network error, unexpected error
- **logout**: Added `toast({ title: 'Signed out', description: 'You have been successfully signed out.' })`

### Firebase Auth State Persistence (`src/stores/authStore.ts`)
- Added `onAuthStateChanged` listener in the `initialize` method of authStore
- When server session check (`/api/auth/me`) returns unauthenticated:
  - If Firebase is configured, registers `onAuthStateChanged` listener
  - If Firebase user exists but server session expired, re-establishes session by sending ID token to `/api/auth/google`
  - On successful session re-establishment: sets user state, navigates to dashboard, shows "Welcome back!" toast
  - If no Firebase user: sets unauthenticated state
  - Returns early from initialize to wait for `onAuthStateChanged` callback (async)
- Falls back to unauthenticated state if Firebase check fails

## Lint Status
- All changes pass `bun run lint` with zero errors
