import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode || !inviteCode.trim()) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    // Find workspace by invite code
    const workspace = await db.workspace.findUnique({
      where: { inviteCode: inviteCode.trim() },
      include: {
        members: {
          select: { id: true, userId: true, role: true, joinedAt: true },
        },
        _count: {
          select: { members: true, channels: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Invalid invite code. No workspace found.' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: workspace.id, userId: user.id },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this workspace.', workspace },
        { status: 409 }
      );
    }

    // Add user as member
    const member = await db.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'member',
      },
    });

    // Update workspace counts in response
    const updatedWorkspace = {
      ...workspace,
      members: [...workspace.members, { id: member.id, userId: user.id, role: member.role, joinedAt: member.joinedAt }],
      _count: {
        members: (workspace._count.members ?? 0) + 1,
        channels: workspace._count.channels ?? 0,
      },
    };

    return NextResponse.json(
      { workspace: updatedWorkspace, message: `Joined "${workspace.name}" successfully!` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Join workspace error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
