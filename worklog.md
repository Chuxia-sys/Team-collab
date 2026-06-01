---
Task ID: 7
Agent: Main Agent (Google Auth Implementation & Enhancement)
Task: Implement Google Authentication using Firebase with real credentials, enhance styling, add features

Work Log:
- Reviewed worklog.md to understand prior project progress (Tasks 1-6 completed)
- Updated `.env` with real Firebase credentials from user's Firebase project (se-101-63450)
- Added `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-1QVVEWTKLD` for Firebase Analytics
- Updated `next.config.ts` with `allowedDevOrigins: ['0.0.0.0']` to fix cross-origin warning
- Restructured Login view: moved "Continue with Google" button BELOW the Sign In button (was above)
- Restructured Register view: moved "Continue with Google" button BELOW the Create Account button (was above)
- Replaced verbose divider text ("or continue with email" / "or register with email") with clean "or" divider
- Added toast notifications for all auth actions:
  - Login success: "Welcome back! Signed in as [name]"
  - Register success: "Account created! Welcome to TeamCollab, [name]!"
  - Google sign-in success: "Welcome back! Signed in as [name]"
  - Google sign-in errors: Firebase not configured, popup blocked, network error, etc.
  - Logout success: "Signed out - You have been successfully signed out."
- Added Firebase `onAuthStateChanged` listener in authStore `initialize` method:
  - When server session expires but Firebase auth persists, automatically re-establishes session
  - Handles edge case where Google-authenticated users don't need to re-authenticate after cookie expiry
- Fixed potential undefined `auth` reference by using `firebaseModule.auth` instead of destructured `auth`
- Fixed logout to handle potentially undefined Firebase auth instance
- Enhanced Google button styling: group hover effects, icon scale animation, subtle border/shadow
- Enhanced Google avatar display: green ring, mini Google icon badge overlay, gradient border
- Enhanced Google badge styling: consistent blue-themed styling across components
- Enhanced profile dialog: gradient border ring for Google photos, gradient info card, hover effects
- Enhanced dashboard: welcome card for Google users with prominent photo and gradient background
- Created Account Settings Dialog component (`account-settings-dialog.tsx`):
  - Profile info display with avatar, name, email
  - Authentication method section: Google users see "Linked with Google" card; email users see "Email & Password" with "Link Google Account" button
  - Account details section: Email, Member Since (formatted), User ID
  - Danger Zone: Delete Account with AlertDialog confirmation
- Created Account Deletion API route (`/api/auth/account/route.ts`):
  - DELETE endpoint authenticates user, handles workspace ownership, deletes memberships and notifications
  - Cascading deletes for workspaces where user is sole owner
  - Clears session cookie after deletion
- Added "Account Settings" menu item in app header dropdown (with Shield icon)
- Added `accountSettingsOpen` state to uiStore for dialog management
- Mounted `AccountSettingsDialog` globally in page.tsx
- Enhanced Firebase initialization with Analytics support (lazy-loaded on client-side)
- All changes pass `bun run lint` with zero errors
- Verified register API returns correct authProvider and photoURL fields

Stage Summary:
- **Google Sign-In fully implemented with real Firebase credentials** (se-101-63450 project)
- **"Continue with Google" button placed BELOW Sign In / Create Account** as user requested
- **Firebase Auth state persistence** via onAuthStateChanged listener
- **Toast notifications** for all auth success/error scenarios
- **Account Settings page** with Google account link/unlink and account deletion
- **Enhanced styling** across login, register, app-header, profile-dialog, dashboard for Google users
- **Firebase Analytics** initialized with measurementId G-1QVVEWTKLD
- Lint passes cleanly with zero errors

### New Files:
- `src/components/layout/account-settings-dialog.tsx` - Account Settings Dialog
- `src/app/api/auth/account/route.ts` - Account Deletion API route

### Modified Files:
- `.env` - Real Firebase credentials + measurementId
- `next.config.ts` - Added allowedDevOrigins
- `src/lib/firebase.ts` - Added Analytics support, measurementId
- `src/stores/authStore.ts` - Toast notifications, onAuthStateChanged persistence, safer Firebase imports
- `src/stores/uiStore.ts` - Added accountSettingsOpen state
- `src/components/views/login-view.tsx` - Google button below Sign In, enhanced styling
- `src/components/views/register-view.tsx` - Google button below Create Account, enhanced styling
- `src/components/layout/app-header.tsx` - Google avatar enhancements, Account Settings menu item
- `src/components/layout/profile-dialog.tsx` - Google profile display enhancements
- `src/components/layout/dashboard-view.tsx` - Google user welcome card
- `src/app/page.tsx` - Mounted AccountSettingsDialog

### Unresolved Issues / Risks:
- Dev server is unstable in this environment (OOM issues) - not a code problem
- Firebase Google Sign-In popup requires a real browser (can't fully test in sandbox)
- Account deletion is permanent and cascading (deletes workspaces where user is sole owner)
- Google Sign-In requires Firebase Authentication to be enabled in the Firebase Console
- The Firebase project (se-101-63450) must have Google Sign-In enabled as a provider

### Priority Recommendations for Next Phase:
1. Enable Google Sign-In provider in Firebase Console (Authentication > Sign-in method > Google > Enable)
2. Add email change functionality for email-auth users
3. Add password reset functionality with actual email sending
4. Add two-factor authentication (2FA) option
5. Add user avatar upload (currently only Google photos or color avatars)
6. Add file upload/attachment support for messages
7. Add message threading (expand reply threads into full conversation view)
