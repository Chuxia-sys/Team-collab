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

    const members = await db.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, status: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json({ members }, { status: 200 });
  } catch (error) {
    console.error('List members error:', error);
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
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions to add members' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { email } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
    }

    const existingMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUser.id },
      },
    });
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 409 });
    }

    const newMember = await db.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role: role || 'member',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, status: true },
        },
      },
    });

    await db.notification.create({
      data: {
        userId: targetUser.id,
        type: 'invite',
        title: 'Workspace Invite',
        message: `${user.name} added you to a workspace`,
        actorId: user.id,
        workspaceId,
      },
    });

    return NextResponse.json({ member: newMember }, { status: 201 });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
