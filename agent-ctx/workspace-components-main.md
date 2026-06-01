# Task: Workspace Sub-View Components

## Summary
Created all 13 workspace sub-view components for the TeamCollab platform, plus 2 new Zustand stores (spreadsheetStore, presentationStore), and updated the workspace-view.tsx to use the real components instead of placeholders.

## Files Created

### Stores
1. `/home/z/my-project/src/stores/spreadsheetStore.ts` - Zustand store for spreadsheets CRUD, matching the API response format `{ spreadsheet }` / `{ spreadsheets }`
2. `/home/z/my-project/src/stores/presentationStore.ts` - Zustand store for presentations CRUD, matching the API response format `{ presentation }` / `{ presentations }`

### Workspace Components
3. `/home/z/my-project/src/components/workspace/channel-view.tsx` - Full channel chat view with message list, hover actions (reply, edit, delete, pin, react), reply/edit mode, auto-scroll, pinned messages banner
4. `/home/z/my-project/src/components/workspace/tasks-view.tsx` - Kanban board with @dnd-kit drag-and-drop, 5 columns (Backlog, To Do, In Progress, Review, Done), task cards with priority badges, assignee avatars, due dates, edit/delete on hover
5. `/home/z/my-project/src/components/workspace/documents-view.tsx` - Document grid with search, cards showing title/date/version/creator, new document button
6. `/home/z/my-project/src/components/workspace/document-edit-view.tsx` - Document editor with editable title, markdown textarea, auto-save (2s debounce), last saved indicator, share/export buttons
7. `/home/z/my-project/src/components/workspace/spreadsheets-view.tsx` - Spreadsheet grid with search, cards, new spreadsheet button
8. `/home/z/my-project/src/components/workspace/spreadsheet-edit-view.tsx` - Table editor with add/remove row/column, editable cells and column names, auto-save, title editing
9. `/home/z/my-project/src/components/workspace/presentations-view.tsx` - Presentation grid with search, cards showing slide count, new presentation button
10. `/home/z/my-project/src/components/workspace/presentation-edit-view.tsx` - Slide editor with left sidebar slide list, slide preview, add/delete/reorder slides, title+content per slide, auto-save
11. `/home/z/my-project/src/components/workspace/members-view.tsx` - Members list with search, role badges with icons, invite dialog (email+role), role change dropdown, remove member with confirmation, "(you)" indicator
12. `/home/z/my-project/src/components/workspace/notifications-view.tsx` - Notifications list with type-based icons/colors, unread indicator (blue dot + left border), mark as read on click, mark all read button, relative timestamps
13. `/home/z/my-project/src/components/workspace/settings-view.tsx` - General settings (name, description), invite link with copy, members list with role management, danger zone (delete workspace, owner only)
14. `/home/z/my-project/src/components/workspace/create-channel-dialog.tsx` - Channel creation dialog with name, description, type (text/voice/announcement), topic, private toggle
15. `/home/z/my-project/src/components/workspace/create-task-dialog.tsx` - Task creation/edit dialog with title, description, priority (color-coded), assignee (from members), due date

### Updated Files
- `/home/z/my-project/src/components/views/workspace-view.tsx` - Replaced all placeholder components with real workspace sub-view imports, changed main from `overflow-y-auto` to `overflow-hidden` for proper sub-view scrolling

## Key Design Decisions
- Used framer-motion for animations (fade-in, layout transitions, AnimatePresence for list items)
- All components use 'use client' directive
- Green theme via `bg-primary`, `text-primary` etc. (mapped to #468432)
- shadcn/ui components throughout (Card, Button, Dialog, Select, etc.)
- Auto-save pattern: debounced saves with unsaved changes indicator
- Spreadsheet/Presentation stores use actual API response format instead of generic ApiResponse type
- Task dialog uses key-based remounting pattern to avoid lint errors with setState in useEffect
- Responsive design with grid breakpoints (sm, md, lg, xl)
