// ============================================
// Team Collaboration Platform - Type Definitions
// ============================================

// --- User ---
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  avatar: string | null;
  status: 'online' | 'offline' | 'away' | 'busy';
  createdAt: string;
  updatedAt: string;
}

// --- Workspace ---
export interface Workspace {
  id: string;
  name: string;
  description: string;
  avatar: string | null;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  members?: WorkspaceMember[];
  channels?: Channel[];
  _count?: {
    members: number;
    channels: number;
  };
  creator?: User;
}

// --- Workspace Member ---
export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
  joinedAt: string;
  user?: User;
}

// --- Channel ---
export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  type: 'text' | 'voice' | 'announcement';
  isPrivate: boolean;
  topic: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// --- Message ---
export interface Message {
  id: string;
  channelId: string;
  workspaceId: string;
  userId: string;
  content: string;
  isEdited: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  parentId: string | null;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  author?: User;
  replies?: Message[];
}

// --- Document ---
export interface Document {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  version: number;
  tags: string;
  folder: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  creator?: User;
}

// --- Spreadsheet ---
export interface Spreadsheet {
  id: string;
  workspaceId: string;
  title: string;
  columns: string; // JSON string
  rows: string; // JSON string
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  creator?: User;
}

// --- Presentation ---
export interface Presentation {
  id: string;
  workspaceId: string;
  title: string;
  slides: string; // JSON string
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  creator?: User;
}

// --- Task ---
export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assigneeId: string | null;
  createdBy: string;
  dueDate: string | null;
  tags: string;
  order: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  assignee?: User | null;
}

// --- Notification ---
export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'message' | 'invite' | 'task_assigned' | 'info';
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  actorId: string | null;
  workspaceId: string | null;
  createdAt: string;
}

// --- API Response Types ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  hasMore?: boolean;
  total?: number;
}

// --- Auth Types ---
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

// --- Workspace Types ---
export interface CreateWorkspaceData {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  description?: string;
  avatar?: string;
}

export interface InviteMemberData {
  email: string;
  role?: 'admin' | 'moderator' | 'member' | 'guest';
}

export interface UpdateMemberRoleData {
  role: 'admin' | 'moderator' | 'member' | 'guest';
}

// --- Channel Types ---
export interface CreateChannelData {
  name: string;
  description?: string;
  type?: 'text' | 'voice' | 'announcement';
  isPrivate?: boolean;
  topic?: string;
}

export interface UpdateChannelData {
  name?: string;
  description?: string;
  topic?: string;
  archived?: boolean;
}

// --- Message Types ---
export interface SendMessageData {
  content: string;
  parentId?: string;
}

export interface UpdateMessageData {
  content: string;
}

// --- Task Types ---
export interface CreateTaskData {
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  assigneeId?: string;
  dueDate?: string;
  tags?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  assigneeId?: string | null;
  dueDate?: string | null;
  tags?: string;
  order?: number;
}

// --- Document Types ---
export interface CreateDocumentData {
  title?: string;
  content?: string;
  folder?: string;
  tags?: string;
}

export interface UpdateDocumentData {
  title?: string;
  content?: string;
  tags?: string;
  folder?: string | null;
}

// --- UI Navigation Types ---
export type AppView = 'landing' | 'login' | 'register' | 'dashboard' | 'workspace';

export type WorkspaceSubView =
  | 'home'
  | 'channel'
  | 'tasks'
  | 'documents'
  | 'document-edit'
  | 'spreadsheets'
  | 'spreadsheet-edit'
  | 'presentations'
  | 'presentation-edit'
  | 'members'
  | 'notifications'
  | 'settings';

export interface NavigateParams {
  workspaceId?: string;
  channelId?: string;
  documentId?: string;
  spreadsheetId?: string;
  presentationId?: string;
  taskId?: string;
  subView?: WorkspaceSubView;
}
