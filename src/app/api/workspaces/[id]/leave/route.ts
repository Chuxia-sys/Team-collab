import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';
import { doc, getDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { getFirestoreApp } from '@/lib/firebase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const member = await requireWorkspaceMember(id, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const firestore = getFirestoreApp();

    // Cannot leave as owner if there are other members
    if (member.role === 'owner') {
      const membersSnap = await getDocs(collection(firestore, `workspaces/${id}/members`));
      const allMembers = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const otherOwners = allMembers.filter((m: any) => m.role === 'owner' && m.userId !== user.id);
      const totalMembers = allMembers.length;

      if (totalMembers > 1 && otherOwners.length === 0) {
        return NextResponse.json(
          { error: 'You must transfer ownership before leaving the workspace' },
          { status: 400 }
        );
      }

      // If owner is the only member, delete the workspace
      if (totalMembers === 1) {
        await db.workspace.delete({ where: { id } });
        return NextResponse.json({ message: 'Workspace deleted as you were the last member' }, { status: 200 });
      }
    }

    // Delete member using direct Firestore reference
    const memberRef = doc(firestore, `workspaces/${id}/members/${user.id}`);
    await deleteDoc(memberRef);

    return NextResponse.json({ message: 'Left workspace successfully' }, { status: 200 });
  } catch (error) {
    console.error('Leave workspace error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
