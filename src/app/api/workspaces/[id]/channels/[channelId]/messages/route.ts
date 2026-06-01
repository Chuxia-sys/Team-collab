import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; channelId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, channelId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    // Verify channel belongs to workspace
    const channel = await db.channel.findFirst({
      where: { id: channelId, workspaceId },
    });
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where: {
          channelId,
          workspaceId,
          isDeleted: false,
          parentId: null, // Only top-level messages
        },
        include: {
          author: {
            select: { id: true, name: true, avatar: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.message.count({
        where: {
          channelId,
          workspaceId,
          isDeleted: false,
          parentId: null,
        },
      }),
    ]);

    return NextResponse.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('List messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; channelId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, channelId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const channel = await db.channel.findFirst({
      where: { id: channelId, workspaceId, archived: false },
    });
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // If replying, verify parent message exists
    if (parentId) {
      const parentMessage = await db.message.findFirst({
        where: { id: parentId, channelId, isDeleted: false },
      });
      if (!parentMessage) {
        return NextResponse.json({ error: 'Parent message not found' }, { status: 404 });
      }

      // Increment reply count on parent
      await db.message.update({
        where: { id: parentId },
        data: { replyCount: { increment: 1 } },
      });
    }

    const message = await db.message.create({
      data: {
        content: content.trim(),
        channelId,
        workspaceId,
        userId: user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, status: true },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
