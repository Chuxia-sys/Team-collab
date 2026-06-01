import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setSessionCookie, verifyPassword } from '@/lib/auth';

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

    // Check if this is a Google-auth user trying to use password login
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'This account uses Google Sign-In. Please sign in with Google instead.' },
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

    // Get user with all needed fields (excluding password)
    const userResponse = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        photoURL: true,
        authProvider: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set session cookie using Next.js cookies API
    await setSessionCookie(user.id);

    return NextResponse.json(
      { user: userResponse, message: 'Login successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
