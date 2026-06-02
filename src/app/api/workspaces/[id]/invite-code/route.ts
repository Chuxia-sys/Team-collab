import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/firestore';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions to generate invite code' }, { status: 403 });
    }

    // Generate a new invite code (12-character alphanumeric)
    const newCode = generateId().substring(0, 12);

    await db.workspace.update({
      where: { id: workspaceId },
      data: { inviteCode: newCode },
    });

    return NextResponse.json({
      message: 'Invite code generated successfully',
      inviteCode: newCode,
    }, { status: 200 });
  } catch (error) {
    console.error('Generate invite code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
