import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const workspaces = await db.workspace.findMany({
      where: {
        members: {
          some: { userId: user.id },
        },
      },
      include: {
        members: {
          select: { id: true, userId: true, role: true, joinedAt: true },
        },
        _count: {
          select: { members: true, channels: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

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
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
        channels: {
          create: {
            name: 'general',
            description: 'General discussion',
            type: 'text',
            createdBy: user.id,
          },
        },
      },
      include: {
        members: {
          select: { id: true, userId: true, role: true, joinedAt: true },
        },
        channels: true,
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error('Create workspace error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
