import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const unreadOnly = searchParams.get('unread') === 'true';
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: user.id };
    if (unreadOnly) where.read = false;

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, avatar: true, photoURL: true },
          },
        },
      }),
      db.notification.count({ where }),
    ]);

    // Enrich notifications with actor info where possible
    const enrichedNotifications = await Promise.all(
      notifications.map(async (n) => {
        let actor = null;
        if (n.actorId) {
          actor = await db.user.findUnique({
            where: { id: n.actorId },
            select: { id: true, name: true, avatar: true, photoURL: true },
          });
        }
        return { ...n, actor };
      })
    );

    const unreadCount = await db.notification.count({
      where: { userId: user.id, read: false },
    });

    return NextResponse.json({
      notifications: enrichedNotifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('List notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
