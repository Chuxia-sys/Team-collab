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

    // Update invitation status
    await db.invitation.update({
      where: { id: invitationId },
      data: { status: 'declined' },
    });

    // Remove the notification as well
    if (notificationId) {
      await db.notification.delete({
        where: { id: notificationId },
      });
    }

    return NextResponse.json({
      message: 'Invitation declined',
    }, { status: 200 });
  } catch (error) {
    console.error('Decline invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
