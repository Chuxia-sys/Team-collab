import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { getFirestoreApp } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode || !inviteCode.trim()) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    // Find workspace by invite code — Firestore field query
    const workspaceRaw = await db.workspace.findUnique({
      where: { inviteCode: inviteCode.trim() },
    });

    if (!workspaceRaw) {
      return NextResponse.json({ error: 'Invalid invite code. No workspace found.' }, { status: 404 });
    }

    const ws = workspaceRaw as any;

    // Check if user is already a member
    const firestore = getFirestoreApp();
    const memberRef = doc(firestore, `workspaces/${ws.id}/members/${user.id}`);
    const memberSnap = await getDoc(memberRef);

    if (memberSnap.exists()) {
      return NextResponse.json(
        { error: 'You are already a member of this workspace.', workspace: ws },
        { status: 409 }
      );
    }

    // Add user as member (using userId as doc ID for faster lookup)
    const member = await db.workspaceMember.create({
      data: {
        id: user.id,
        workspaceId: ws.id,
        userId: user.id,
        role: 'member',
      } as any,
    });

    // Fetch counts for response
    const membersSnap = await getDocs(collection(firestore, `workspaces/${ws.id}/members`));
    const channelsSnap = await getDocs(collection(firestore, `workspaces/${ws.id}/channels`));

    // Fetch creator
    let creator = null;
    if (ws.createdBy) {
      const creatorSnap = await getDoc(doc(firestore, `users/${ws.createdBy}`));
      if (creatorSnap.exists()) {
        const cd = creatorSnap.data();
        creator = { id: creatorSnap.id, name: cd.name, avatar: cd.avatar || null };
      }
    }

    const updatedWorkspace = {
      ...ws,
      members: [
        { id: (member as any).id, userId: user.id, role: 'member', joinedAt: (member as any).joinedAt },
      ],
      _count: {
        members: membersSnap.size,
        channels: channelsSnap.size,
      },
      creator,
    };

    return NextResponse.json(
      { workspace: updatedWorkspace, message: `Joined "${ws.name}" successfully!` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Join workspace error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
