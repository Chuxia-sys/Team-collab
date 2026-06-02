import { NextResponse } from 'next/server';
import { getAuthUser, clearSessionCookie } from '@/lib/auth';
import { db } from '@/lib/db';
import { getFirestoreApp } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export async function DELETE() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const firestore = getFirestoreApp();

    // Delete workspace memberships for workspaces where user is the only owner
    const ownedWorkspaces = await db.workspace.findMany({
      where: { createdBy: user.id } as any,
    });

    for (const workspace of ownedWorkspaces) {
      const ws = workspace as any;
      // Check members subcollection
      const membersSnap = await getDocs(collection(firestore, `workspaces/${ws.id}/members`));
      const otherOwners = membersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((m: any) => m.role === 'owner' && m.userId !== user.id);

      if (otherOwners.length === 0) {
        // User is the only owner - delete the entire workspace
        await db.workspace.delete({ where: { id: ws.id } });
      }
    }

    // Delete remaining memberships across all workspaces
    const allWs = await db.workspace.findMany();
    for (const w of allWs) {
      const wid = (w as any).id;
      try {
        const memberRef = doc(firestore, `workspaces/${wid}/members/${user.id}`);
        await deleteDoc(memberRef);
      } catch {
        // Member might not exist, ignore
      }
    }

    // Delete notifications for this user
    const notifSnap = await getDocs(collection(firestore, `users/${user.id}/notifications`));
    for (const d of notifSnap.docs) {
      await deleteDoc(doc(firestore, `users/${user.id}/notifications/${d.id}`));
    }

    // Delete the user
    await db.user.delete({ where: { id: user.id } });

    // Clear session
    await clearSessionCookie();

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
