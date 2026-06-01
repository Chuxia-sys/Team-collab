import { NextResponse } from 'next/server';
import { getAuthUser, clearSessionCookie } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const user = await getAuthUser();
    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: { status: 'offline' },
      });
    }

    // Clear session cookie using Next.js cookies API
    await clearSessionCookie();

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
