import { NextResponse } from 'next/server';
import { clearSessionCookie, getAuthUser } from '@/lib/auth';
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

    const cookie = clearSessionCookie();
    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200, headers: { 'Set-Cookie': cookie } }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
