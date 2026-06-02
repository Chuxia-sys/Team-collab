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

    // Note: We avoid using orderBy on joinedAt since some member documents
    // may not have a joinedAt field, which causes Firestore to exclude them.
    // We sort in-memory instead.
    const rawMembers = await db.workspaceMember.findMany({
      where: { workspaceId },
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
    for (const m of rawMembers) {
      const existing = dedupMap.get(m.userId);
      if (!existing || (roleRank[m.role] ?? 0) > (roleRank[existing.role] ?? 0)) {
        dedupMap.set(m.userId, m);
      }
    }
    const members = Array.from(dedupMap.values());

    // Sort by joinedAt (falling back to createdAt) in-memory
    members.sort((a: any, b: any) => {
      const aDate = a.joinedAt?.toDate?.()?.getTime() || a.createdAt?.toDate?.()?.getTime() || 0;
      const bDate = b.joinedAt?.toDate?.()?.getTime() || b.createdAt?.toDate?.()?.getTime() || 0;
      return aDate - bDate;
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

    // Check if user is already a member
    const existingMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUser.id },
      },
    });
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 409 });
    }

    // Check for a pending invitation that hasn't been responded to
    // We query by userId and filter in-memory to avoid needing a Firestore composite index
    const allInvitations = await db.invitation.findMany({
      where: { userId: targetUser.id },
    });
    const pendingInvitation = allInvitations.find(
      (inv: any) => inv.workspaceId === workspaceId && inv.status === 'pending'
    );
    if (pendingInvitation) {
      return NextResponse.json({ error: 'User already has a pending invitation to this workspace' }, { status: 409 });
    }

    // Create an invitation instead of directly adding the member
    const invitation = await db.invitation.create({
      data: {
        userId: targetUser.id,
        invitedBy: user.id,
        workspaceId,
        role: role || 'member',
        status: 'pending',
      },
    });

    // Send a notification with accept/decline options to the invited user
    await db.notification.create({
      data: {
        userId: targetUser.id,
        type: 'workspace_invite',
        title: 'Workspace Invitation',
        message: `${user.name} invited you to join a workspace`,
        actorId: user.id,
        workspaceId,
        invitationId: invitation.id,
      },
    });

    return NextResponse.json({
      message: 'Invitation sent',
      invitation: {
        id: invitation.id,
        status: invitation.status,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
