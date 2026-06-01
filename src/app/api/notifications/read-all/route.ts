import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PUT() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return NextResponse.json({ message: 'All notifications marked as read' }, { status: 200 });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
