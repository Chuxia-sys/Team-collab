import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

// Firebase Identity Toolkit API endpoint for verifying Firebase ID tokens
// See: https://firebase.google.com/docs/reference/rest/auth#section-verify-custom-token
const FIREBASE_VERIFY_TOKEN_URL =
  `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}`;

interface FirebaseAccountLookupResponse {
  users?: Array<{
    localId: string;
    email: string;
    emailVerified: boolean;
    displayName?: string;
    photoUrl?: string;
    providerUserInfo?: Array<{
      providerId: string;
      federatedId?: string;
      rawId?: string;
      screenName?: string;
      displayName?: string;
      photoUrl?: string;
      email?: string;
    }>;
    validSince?: string;
    lastLoginAt?: string;
    createdAt?: string;
  }>;
  error?: {
    code: number;
    message: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, email, name, photoURL } = body;

    if (!idToken) {
      console.error('[Google Auth] Missing ID token in request body');
      return NextResponse.json(
        { error: 'Google ID token is required' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      console.error('[Google Auth] Firebase API key is not configured in environment variables');
      return NextResponse.json(
        { error: 'Firebase is not configured. Please add Firebase credentials to the server environment.' },
        { status: 500 }
      );
    }

    // --- Step 1: Verify the Firebase ID token using Firebase Identity Toolkit API ---
    let firebaseUser: FirebaseAccountLookupResponse['users'][number];
    try {
      const verifyResponse = await fetch(FIREBASE_VERIFY_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const result: FirebaseAccountLookupResponse = await verifyResponse.json();

      if (result.error) {
        console.error(
          '[Google Auth] Firebase token verification failed:',
          `code=${result.error.code}`,
          `message=${result.error.message}`,
          `idTokenPreview=${idToken.substring(0, 20)}...`
        );
        return NextResponse.json(
          { error: 'Invalid Google token. Please try again.' },
          { status: 401 }
        );
      }

      if (!result.users || result.users.length === 0) {
        console.error('[Google Auth] Firebase token verification returned no users');
        return NextResponse.json(
          { error: 'Invalid Google token. Please try again.' },
          { status: 401 }
        );
      }

      firebaseUser = result.users[0];
      console.log(
        '[Google Auth] Token verified successfully:',
        `email=${firebaseUser.email}`,
        `localId=${firebaseUser.localId}`
      );
    } catch (verifyError) {
      console.error('[Google Auth] Failed to call Firebase verification API:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify Google credentials. Please try again.' },
        { status: 401 }
      );
    }

    // --- Step 2: Extract verified user info from Firebase response ---
    // Use the verified data from Firebase, not the client-provided data
    const verifiedEmail = firebaseUser.email;
    const verifiedName = firebaseUser.displayName || name || (verifiedEmail ? verifiedEmail.split('@')[0] : 'User');
    // Firebase returns photoUrl (lowercase 'u'), but our schema uses photoURL (uppercase 'U')
    const verifiedPhotoURL = firebaseUser.photoUrl || photoURL || null;

    if (!verifiedEmail) {
      console.error('[Google Auth] Firebase account has no email address');
      return NextResponse.json(
        { error: 'Could not retrieve email from Google account' },
        { status: 400 }
      );
    }

    // --- Step 3: Create or update user in Firestore ---
    let user = await db.user.findUnique({ where: { email: verifiedEmail } });

    const toResponse = (u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      avatar: u.avatar || null,
      photoURL: u.photoURL || null,
      authProvider: u.authProvider,
      status: u.status,
      createdAt: u.createdAt?.toDate?.()?.toISOString() || u.createdAt,
      updatedAt: u.updatedAt?.toDate?.()?.toISOString() || u.updatedAt,
    });

    if (user) {
      // Existing user - update their info as needed
      const updateData: Record<string, unknown> = { status: 'online' };

      const u = user as any;
      if (verifiedPhotoURL && (!u.photoURL || u.authProvider === 'google')) {
        updateData.photoURL = verifiedPhotoURL;
      }

      if (u.authProvider === 'google' && verifiedName && u.name !== verifiedName) {
        updateData.name = verifiedName;
      }

      if (u.authProvider === 'email') {
        updateData.authProvider = 'google';
        if (verifiedPhotoURL) {
          updateData.photoURL = verifiedPhotoURL;
        }
      }

      const updated = await db.user.update({
        where: { id: u.id },
        data: updateData,
      });
      console.log('[Google Auth] Existing user updated:', verifiedEmail, u.id);
      user = toResponse(updated);
    } else {
      // New user - create account
      const created = await db.user.create({
        data: {
          email: verifiedEmail,
          name: verifiedName,
          photoURL: verifiedPhotoURL,
          authProvider: 'google',
        },
      });
      console.log('[Google Auth] New user created:', verifiedEmail, (created as any).id);
      user = toResponse(created);
    }

    // --- Step 4: Set session cookie ---
    await setSessionCookie(user.id);

    return NextResponse.json(
      { user, message: 'Google sign-in successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Google Auth] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error during Google authentication' },
      { status: 500 }
    );
  }
}
