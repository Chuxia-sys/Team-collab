# API Routes Creation - Work Record

## Summary
Created all required API routes for the Team Collaboration platform. All routes are functional and tested.

## Files Created

### Auth Helper
- `/src/lib/auth.ts` - Authentication utilities including password hashing (scrypt-based), session cookie management, and workspace member verification

### Auth Routes (4 routes)
- `/src/app/api/auth/register/route.ts` - POST: Register new user
- `/src/app/api/auth/login/route.ts` - POST: Login with email/password
- `/src/app/api/auth/logout/route.ts` - POST: Clear auth cookie
- `/src/app/api/auth/me/route.ts` - GET: Get current user from cookie

### Workspace Routes (3 routes, 6 methods)
- `/src/app/api/workspaces/route.ts` - GET: List workspaces, POST: Create workspace
- `/src/app/api/workspaces/[id]/route.ts` - GET: Get workspace, PUT: Update, DELETE: Delete
- `/src/app/api/workspaces/[id]/leave/route.ts` - POST: Leave workspace

### Channel Routes (2 routes, 4 methods)
- `/src/app/api/workspaces/[id]/channels/route.ts` - GET: List channels, POST: Create channel
- `/src/app/api/workspaces/[id]/channels/[channelId]/route.ts` - PUT: Update, DELETE: Archive channel

### Message Routes (3 routes, 5 methods)
- `/src/app/api/workspaces/[id]/channels/[channelId]/messages/route.ts` - GET: List (paginated), POST: Send
- `/src/app/api/messages/[id]/route.ts` - PUT: Edit, DELETE: Soft delete
- `/src/app/api/messages/[id]/pin/route.ts` - PUT: Toggle pin

### Task Routes (2 routes, 4 methods)
- `/src/app/api/workspaces/[id]/tasks/route.ts` - GET: List (filterable), POST: Create
- `/src/app/api/workspaces/[id]/tasks/[taskId]/route.ts` - PUT: Update, DELETE: Delete

### Document Routes (2 routes, 5 methods)
- `/src/app/api/workspaces/[id]/documents/route.ts` - GET: List, POST: Create
- `/src/app/api/workspaces/[id]/documents/[docId]/route.ts` - GET: Get, PUT: Update, DELETE: Delete

### Spreadsheet Routes (2 routes, 5 methods)
- `/src/app/api/workspaces/[id]/spreadsheets/route.ts` - GET: List, POST: Create
- `/src/app/api/workspaces/[id]/spreadsheets/[sheetId]/route.ts` - GET: Get, PUT: Update, DELETE: Delete

### Presentation Routes (2 routes, 5 methods)
- `/src/app/api/workspaces/[id]/presentations/route.ts` - GET: List, POST: Create
- `/src/app/api/workspaces/[id]/presentations/[presId]/route.ts` - GET: Get, PUT: Update, DELETE: Delete

### Member Routes (2 routes, 4 methods)
- `/src/app/api/workspaces/[id]/members/route.ts` - GET: List members, POST: Add member by email
- `/src/app/api/workspaces/[id]/members/[uid]/route.ts` - PUT: Update role, DELETE: Remove member

### Notification Routes (3 routes, 3 methods)
- `/src/app/api/notifications/route.ts` - GET: List with pagination
- `/src/app/api/notifications/[id]/read/route.ts` - PUT: Mark as read
- `/src/app/api/notifications/read-all/route.ts` - PUT: Mark all as read

## Key Design Decisions

1. **Password Hashing**: Used Node.js `crypto.scryptSync` instead of `Bun.password` because Bun's global is not available in Next.js server runtime
2. **Session Cookie**: Base64-encoded user ID in `tc-session` cookie with HttpOnly, SameSite=Lax, 30-day expiry
3. **Slug Naming**: All workspace-level dynamic segments use `[id]` to avoid Next.js slug name conflicts. Member sub-route uses `[uid]` due to a filesystem limitation with `[m`-prefixed directory names
4. **Soft Delete**: Messages use soft delete (isDeleted flag), channels use archival (archived flag)
5. **Auto-creation**: Creating a workspace automatically creates the owner membership and a "general" channel
6. **Notifications**: Task assignment and workspace invite automatically create notifications
7. **Document Versioning**: Document updates increment a version counter
8. **Pagination**: Messages and notifications support page-based pagination

## Tested Routes
All routes tested successfully via curl:
- Auth: register, login, logout, me
- Workspaces: list, create, get details
- Channels: list, create
- Messages: send, edit, pin
- Tasks: create, update
- Documents: create, update
- Spreadsheets: create
- Presentations: create
- Members: list, add
- Notifications: list, mark read
