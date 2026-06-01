import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ['online', 'away', 'busy', 'offline'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: online, away, busy, offline' },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: { status },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        photoURL: user.photoURL,
        authProvider: user.authProvider,
        status,
        createdAt: user.createdAt,
        updatedAt: new Date().toISOString(),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
