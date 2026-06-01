import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, uid: targetUserId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const targetMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId },
      },
    });
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    const validRoles = ['owner', 'admin', 'moderator', 'member', 'guest'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (targetMember.role === 'owner' && role !== 'owner') {
      const ownerCount = await db.workspaceMember.count({
        where: { workspaceId, role: 'owner' },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner. Transfer ownership first.' },
          { status: 400 }
        );
      }
    }

    if (targetMember.role === 'owner' && member.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can change owner roles' }, { status: 403 });
    }

    const updatedMember = await db.workspaceMember.update({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId },
      },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, status: true },
        },
      },
    });

    return NextResponse.json({ member: updatedMember }, { status: 200 });
  } catch (error) {
    console.error('Update member role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, uid: targetUserId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const targetMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId },
      },
    });
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove an owner from the workspace' }, { status: 400 });
    }

    const roleHierarchy: Record<string, number> = { owner: 4, admin: 3, moderator: 2, member: 1, guest: 0 };
    if ((roleHierarchy[targetMember.role] ?? 0) >= (roleHierarchy[member.role] ?? 0)) {
      return NextResponse.json({ error: 'Cannot remove someone with equal or higher role' }, { status: 403 });
    }

    await db.workspaceMember.delete({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId },
      },
    });

    return NextResponse.json({ message: 'Member removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
