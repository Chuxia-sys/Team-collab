import { NextResponse } from 'next/server';
import { getAuthUser, clearSessionCookie } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Delete the user - cascading will handle related records
    // But first delete workspace memberships for workspaces where user is the only owner
    const ownedWorkspaces = await db.workspace.findMany({
      where: { createdBy: user.id },
      include: { members: true },
    });

    for (const workspace of ownedWorkspaces) {
      const otherOwners = workspace.members.filter(
        (m) => m.role === 'owner' && m.userId !== user.id
      );
      if (otherOwners.length === 0) {
        // User is the only owner - delete the entire workspace
        await db.workspace.delete({ where: { id: workspace.id } });
      }
    }

    // Delete remaining memberships
    await db.workspaceMember.deleteMany({ where: { userId: user.id } });

    // Delete notifications
    await db.notification.deleteMany({ where: { userId: user.id } });

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
