import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';

export async function PUT(
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
    if (!member || (member.role !== 'owner' && member.role !== 'admin' && member.role !== 'moderator')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const channel = await db.channel.findFirst({
      where: { id: channelId, workspaceId },
    });
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, type, isPrivate, topic, archived } = body;

    const updatedChannel = await db.channel.update({
      where: { id: channelId, workspaceId },
      data: {
        ...(name !== undefined && { name: name.trim().toLowerCase() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(type !== undefined && { type }),
        ...(isPrivate !== undefined && { isPrivate }),
        ...(topic !== undefined && { topic: topic?.trim() || null }),
        ...(archived !== undefined && { archived }),
      },
    });

    return NextResponse.json({ channel: updatedChannel }, { status: 200 });
  } catch (error) {
    console.error('Update channel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const channel = await db.channel.findFirst({
      where: { id: channelId, workspaceId },
    });
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const archivedChannel = await db.channel.update({
      where: { id: channelId, workspaceId },
      data: { archived: true },
    });

    return NextResponse.json({ channel: archivedChannel, message: 'Channel archived successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete channel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
