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

    // Fetch workspace without the include.members (applyIncludeRemote doesn't handle 'members' relation)
    const workspace = await db.workspace.findUnique({
      where: { id },
      include: {
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

    // Manually fetch members
    const members = await db.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, status: true },
        },
      },
    });

    // Deduplicate by userId, keeping the one with the highest permission role
    const roleRank: Record<string, number> = {
      owner: 4, admin: 3, moderator: 2, member: 1, guest: 0,
    };
    const dedupMap = new Map<string, any>();
    for (const m of members) {
      const existing = dedupMap.get(m.userId);
      if (!existing || (roleRank[m.role] ?? 0) > (roleRank[existing.role] ?? 0)) {
        dedupMap.set(m.userId, m);
      }
    }
    const dedupedMembers = Array.from(dedupMap.values());

    // Sort by joinedAt (falling back to createdAt) in-memory
    dedupedMembers.sort((a: any, b: any) => {
      const aDate = a.joinedAt?.toDate?.()?.getTime() || a.createdAt?.toDate?.()?.getTime() || 0;
      const bDate = b.joinedAt?.toDate?.()?.getTime() || b.createdAt?.toDate?.()?.getTime() || 0;
      return aDate - bDate;
    });

    return NextResponse.json({ workspace: { ...workspace, members: dedupedMembers } }, { status: 200 });
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
