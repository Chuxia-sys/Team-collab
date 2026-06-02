import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { generateId } from '@/lib/firestore';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Firestore approach: find all workspaces where user is a member
    // Since members are stored as subcollections, we query all workspaces
    // and filter by membership. For scalability, consider adding a
    // userWorkspaces collection in the future.
    const allWorkspaces = await db.workspace.findMany({
      include: {
        _count: {
          select: { members: true, channels: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Filter to only workspaces where user is a member
    const workspaces: any[] = [];
    for (const ws of allWorkspaces) {
      const membersRaw = await db.workspaceMember.findMany({
        where: { workspaceId: ws.id } as any,
      });
      const isMember = membersRaw.some((m: any) => m.userId === user.id);
      if (isMember) {
        const members = membersRaw.map((m: any) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt?.toDate?.()?.toISOString() || m.joinedAt,
        }));
        workspaces.push({ ...ws, members });
      }
    }

    return NextResponse.json({ workspaces }, { status: 200 });
  } catch (error) {
    console.error('List workspaces error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, avatar } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    // Create workspace, add creator as owner, and create default general channel
    const workspace = await db.workspace.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        avatar: avatar || null,
        createdBy: user.id,
        inviteCode: generateId().substring(0, 12),
      },
    });

    // Add creator as owner member (using userId as doc ID for faster lookup)
    await db.workspaceMember.create({
      data: {
        id: user.id,
        workspaceId: (workspace as any).id,
        userId: user.id,
        role: 'owner',
      } as any,
    });

    // Create default general channel
    await db.channel.create({
      data: {
        workspaceId: (workspace as any).id,
        name: 'general',
        description: 'General discussion',
        type: 'text',
        isPrivate: false,
        archived: false,
        createdBy: user.id,
      } as any,
    });

    // Fetch complete workspace with includes
    // Note: include.members is not handled by applyIncludeRemote, so we query members separately
    const fullWorkspace = await db.workspace.findUnique({
      where: { id: (workspace as any).id },
      include: {
        channels: true,
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Manually fetch members
    const workspaceMembers = await db.workspaceMember.findMany({
      where: { workspaceId: (workspace as any).id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, status: true },
        },
      },
    });

    return NextResponse.json(
      { workspace: { ...fullWorkspace, members: workspaceMembers } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create workspace error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
