import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

// Google token verification endpoint
const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo?id_token=';

interface GoogleTokenInfo {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  // These fields may not be present on error
  error?: string;
  error_description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, email, name, photoURL } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: 'Google ID token is required' },
        { status: 400 }
      );
    }

    // Verify the Google ID token server-side
    let tokenInfo: GoogleTokenInfo;
    try {
      const verifyResponse = await fetch(`${GOOGLE_TOKEN_INFO_URL}${idToken}`);
      tokenInfo = await verifyResponse.json();

      if (tokenInfo.error) {
        console.error('Google token verification failed:', tokenInfo.error, tokenInfo.error_description);
        return NextResponse.json(
          { error: 'Invalid Google token. Please try again.' },
          { status: 401 }
        );
      }
    } catch (verifyError) {
      console.error('Failed to verify Google token:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify Google credentials. Please try again.' },
        { status: 401 }
      );
    }

    // Use verified email from token (not from client for security)
    const verifiedEmail = tokenInfo.email;
    const verifiedName = tokenInfo.name || name || verifiedEmail.split('@')[0];
    const verifiedPhotoURL = tokenInfo.picture || photoURL || null;

    if (!verifiedEmail) {
      return NextResponse.json(
        { error: 'Could not retrieve email from Google account' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await db.user.findUnique({ where: { email: verifiedEmail } });

    if (user) {
      // User exists - update their Google info if needed
      const updateData: Record<string, unknown> = { status: 'online' };

      // Update photo URL if provided by Google and user doesn't have one or is a Google auth user
      if (verifiedPhotoURL && (!user.photoURL || user.authProvider === 'google')) {
        updateData.photoURL = verifiedPhotoURL;
      }

      // Update name if it was previously default-generated
      if (user.authProvider === 'google' && verifiedName && user.name !== verifiedName) {
        updateData.name = verifiedName;
      }

      // If user was email-auth but now signs in with Google, link the accounts
      if (user.authProvider === 'email') {
        updateData.authProvider = 'google';
        if (verifiedPhotoURL) {
          updateData.photoURL = verifiedPhotoURL;
        }
      }

      user = await db.user.update({
        where: { id: user.id },
        data: updateData,
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
    } else {
      // New user - create account with Google info
      user = await db.user.create({
        data: {
          email: verifiedEmail,
          name: verifiedName,
          photoURL: verifiedPhotoURL,
          authProvider: 'google',
          // No passwordHash needed for Google auth users
        },
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
    }

    // Set session cookie using Next.js cookies API
    await setSessionCookie(user.id);

    return NextResponse.json(
      { user, message: 'Google sign-in successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error during Google authentication' },
      { status: 500 }
    );
  }
}
