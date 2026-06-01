import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionCookie, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true, avatar: true, photoURL: true, authProvider: true, status: true, createdAt: true, updatedAt: true },
    });

    const cookie = createSessionCookie(user.id);

    return NextResponse.json(
      { user, message: 'Registration successful' },
      { status: 201, headers: { 'Set-Cookie': cookie } }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
