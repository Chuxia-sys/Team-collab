import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';

export async function GET(
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
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const presentations = await db.presentation.findMany({
      where: { workspaceId },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ presentations }, { status: 200 });
  } catch (error) {
    console.error('List presentations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const body = await request.json();
    const { title, slides } = body;

    const presentation = await db.presentation.create({
      data: {
        title: title?.trim() || 'Untitled Presentation',
        slides: typeof slides === 'string' ? slides : JSON.stringify(slides || []),
        workspaceId,
        createdBy: user.id,
        updatedBy: user.id,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ presentation }, { status: 201 });
  } catch (error) {
    console.error('Create presentation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
