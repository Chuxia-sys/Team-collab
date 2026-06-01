import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionCookie, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update user status to online
    await db.user.update({
      where: { id: user.id },
      data: { status: 'online' },
    });

    const cookie = createSessionCookie(user.id);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return NextResponse.json(
      { user: userWithoutPassword, message: 'Login successful' },
      { status: 200, headers: { 'Set-Cookie': cookie } }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
