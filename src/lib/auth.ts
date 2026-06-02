import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { getFirestoreApp } from './firebase';
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
    });
    if (!user) return null;
    // Convert Firestore Timestamps to ISO strings for API consistency
    const { createdAt, updatedAt, ...rest } = user as any;
    return {
      ...rest,
      createdAt: createdAt?.toDate?.()?.toISOString() || createdAt,
      updatedAt: updatedAt?.toDate?.()?.toISOString() || updatedAt,
    };
  } catch (err) {
    console.error('getAuthUser error:', err);
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

/**
 * Get workspace member by workspace and user.
 * In Firestore, members are stored as subcollection: workspaces/{workspaceId}/members/{docId}
 * where docId is either the userId (for new members) or a generated ID (for legacy members).
 * We query by userId field to handle both cases.
 */
export async function getWorkspaceMember(workspaceId: string, userId: string) {
  try {
    const firestore = getFirestoreApp();
    // Query ALL members by userId and return the one with the highest permission role.
    // We intentionally do NOT do a direct doc-ID lookup first, because there can be
    // duplicate member documents (e.g. legacy docs with generated IDs + newer docs
    // created with userId as doc ID). The direct lookup might return a lower-role
    // duplicate, causing permission checks to fail incorrectly.
    const membersRef = collection(firestore, `workspaces/${workspaceId}/members`);
    const q = query(membersRef, where('userId', '==', userId));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const roleRank: Record<string, number> = {
        owner: 4, admin: 3, moderator: 2, member: 1, guest: 0,
      };
      let bestMember: any = null;
      let bestRank = -1;
      for (const d of querySnap.docs) {
        const data = d.data();
        const rank = roleRank[data.role] ?? 0;
        if (rank > bestRank) {
          bestRank = rank;
          bestMember = { id: d.id, ...data };
        }
      }
      return bestMember;
    }
    return null;
  } catch {
    // Fallback to the model-based query - find all matches and return highest role
    const members = await db.workspaceMember.findMany({
      where: { workspaceId, userId } as any,
      parentId: workspaceId,
    } as any);
    if (members.length === 0) return null;
    const roleRank: Record<string, number> = {
      owner: 4, admin: 3, moderator: 2, member: 1, guest: 0,
    };
    return members.reduce((best: any, m: any) => {
      return (roleRank[m.role] ?? 0) > (roleRank[best.role] ?? 0) ? m : best;
    });
  }
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
