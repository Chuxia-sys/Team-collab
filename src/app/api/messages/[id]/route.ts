import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

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

    if (message.userId !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: 'Cannot edit a deleted message' }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const updatedMessage = await db.message.update({
      where: { id },
      data: {
        content: content.trim(),
        isEdited: true,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, status: true },
        },
      },
    });

    return NextResponse.json({ message: updatedMessage }, { status: 200 });
  } catch (error) {
    console.error('Edit message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Allow the author or workspace admin/owner to delete
    if (message.userId !== user.id) {
      const member = await db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: message.workspaceId, userId: user.id },
        },
      });
      if (!member || (member.role !== 'owner' && member.role !== 'admin' && member.role !== 'moderator')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    // Soft delete
    const deletedMessage = await db.message.update({
      where: { id },
      data: { isDeleted: true, content: 'This message has been deleted' },
    });

    return NextResponse.json({ message: deletedMessage, message_text: 'Message deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
