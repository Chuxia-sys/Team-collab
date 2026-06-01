import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import crypto from 'crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return hash === verifyHash;
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get('tc-session');
  if (!session?.value) return null;

  try {
    const userId = Buffer.from(session.value, 'base64').toString();
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        photoURL: true,
        authProvider: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const encoded = Buffer.from(userId).toString('base64');
  cookieStore.set('tc-session', encoded, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set('tc-session', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
  });
}

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) return null;
  return user;
}

export async function getWorkspaceMember(workspaceId: string, userId: string) {
  return db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });
}

export async function requireWorkspaceMember(workspaceId: string, userId: string) {
  const member = await getWorkspaceMember(workspaceId, userId);
  if (!member) return null;
  return member;
}

export function hasPermission(role: string, requiredRoles: string[]): boolean {
  const roleHierarchy: Record<string, number> = {
    owner: 4,
    admin: 3,
    moderator: 2,
    member: 1,
    guest: 0,
  };
  const userLevel = roleHierarchy[role] ?? 0;
  return requiredRoles.some((r) => (roleHierarchy[r] ?? 0) <= userLevel);
}
