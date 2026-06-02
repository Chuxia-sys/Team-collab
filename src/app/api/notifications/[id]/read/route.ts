import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

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

    // In Firestore, notifications are stored as users/{userId}/notifications/{notificationId}
    const notification = await db.notification.findUnique({
      where: { id, userId: user.id },
    });
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const updatedNotification = await db.notification.update({
      where: { id, userId: user.id },
      data: { read: true },
    });

    return NextResponse.json({ notification: updatedNotification }, { status: 200 });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
