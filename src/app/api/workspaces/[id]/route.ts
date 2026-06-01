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

    const { id } = await params;
    const member = await requireWorkspaceMember(id, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const workspace = await db.workspace.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            joinedAt: true,
            user: {
              select: { id: true, name: true, email: true, avatar: true, status: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        channels: {
          orderBy: { createdAt: 'asc' },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { members: true, channels: true, documents: true, tasks: true },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({ workspace }, { status: 200 });
  } catch (error) {
    console.error('Get workspace error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const member = await requireWorkspaceMember(id, user.id);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, avatar } = body;

    const workspace = await db.workspace.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(avatar !== undefined && { avatar }),
      },
      include: {
        members: {
          select: { id: true, userId: true, role: true, joinedAt: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ workspace }, { status: 200 });
  } catch (error) {
    console.error('Update workspace error:', error);
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
    const member = await requireWorkspaceMember(id, user.id);
    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can delete this workspace' }, { status: 403 });
    }

    await db.workspace.delete({ where: { id } });

    return NextResponse.json({ message: 'Workspace deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete workspace error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
