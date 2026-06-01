import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';

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

    const message = await db.message.findUnique({
      where: { id },
    });
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: 'Cannot pin a deleted message' }, { status: 400 });
    }

    // Verify user is a member of the workspace
    const member = await requireWorkspaceMember(message.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    // Toggle pin
    const updatedMessage = await db.message.update({
      where: { id },
      data: { isPinned: !message.isPinned },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, status: true },
        },
      },
    });

    return NextResponse.json({
      message: updatedMessage,
      pinned: updatedMessage.isPinned,
    }, { status: 200 });
  } catch (error) {
    console.error('Toggle pin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
