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
    const { invitationId, notificationId } = body;

    if (!invitationId) {
      return NextResponse.json({ error: 'Missing invitationId' }, { status: 400 });
    }

    // Find the invitation
    const invitation = await db.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.userId !== user.id) {
      return NextResponse.json({ error: 'This invitation is not for you' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation is no longer pending' }, { status: 400 });
    }

    // Handle workspace invitation
    if (!invitation.channelId) {
      // Check if already a member
      const existingMember = await db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId: user.id,
          },
        },
      });

      if (!existingMember) {
        await db.workspaceMember.create({
          data: {
            id: user.id,
            workspaceId: invitation.workspaceId,
            userId: user.id,
            role: invitation.role,
          },
        });
      }
    } else {
      // Channel invitation - user is already a workspace member, add to channel
      // (channel membership is implicit in this app, but we can add a channel member record if needed)
      // For now, we just mark the invitation as accepted
    }

    // Update invitation status
    await db.invitation.update({
      where: { id: invitationId },
      data: { status: 'accepted' },
    });

    // Mark notification as read if notificationId provided
    if (notificationId) {
      await db.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });
    }

    return NextResponse.json({
      message: 'Invitation accepted',
      invitation: {
        ...invitation,
        status: 'accepted',
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
