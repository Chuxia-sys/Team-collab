import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const channels = await db.channel.findMany({
      where: { workspaceId, archived: false },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { messages: { where: { isDeleted: false } } },
        },
      },
    });

    return NextResponse.json({ channels }, { status: 200 });
  } catch (error) {
    console.error('List channels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member || (member.role !== 'owner' && member.role !== 'admin' && member.role !== 'moderator')) {
      return NextResponse.json({ error: 'Insufficient permissions to create channels' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, type, isPrivate, topic } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
    }

    // Check if channel name already exists in workspace
    const existingChannel = await db.channel.findFirst({
      where: { workspaceId, name: name.trim().toLowerCase() },
    });
    if (existingChannel) {
      return NextResponse.json({ error: 'A channel with this name already exists' }, { status: 409 });
    }

    const channel = await db.channel.create({
      data: {
        name: name.trim().toLowerCase(),
        description: description?.trim() || '',
        type: type || 'text',
        isPrivate: isPrivate || false,
        topic: topic?.trim() || null,
        workspaceId,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    console.error('Create channel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
