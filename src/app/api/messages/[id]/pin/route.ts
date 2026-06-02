import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestoreApp } from '@/lib/firebase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    // Parse workspaceId/channelId from body
    const body = await request.json();
    const { workspaceId, channelId } = body;

    if (!workspaceId || !channelId) {
      return NextResponse.json({ error: 'workspaceId and channelId are required' }, { status: 400 });
    }

    const message = await db.message.findUnique({
      where: { id, workspaceId, channelId },
    });
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: 'Cannot pin a deleted message' }, { status: 400 });
    }

    // Verify user is a member of the workspace
    const firestore = getFirestoreApp();
    const memberRef = doc(firestore, `workspaces/${workspaceId}/members/${user.id}`);
    const memberSnap = await getDoc(memberRef);
    if (!memberSnap.exists()) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    // Toggle pin
    const updatedMessage = await db.message.update({
      where: { id, workspaceId, channelId },
      data: { isPinned: !message.isPinned },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, status: true },
        },
      },
    });

    return NextResponse.json({
      message: updatedMessage,
      pinned: updatedMessage?.isPinned ?? !message.isPinned,
    }, { status: 200 });
  } catch (error) {
    console.error('Toggle pin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
