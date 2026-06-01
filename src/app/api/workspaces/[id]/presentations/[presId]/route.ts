import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; presId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, presId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const presentation = await db.presentation.findFirst({
      where: { id: presId, workspaceId },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
    }

    return NextResponse.json({ presentation }, { status: 200 });
  } catch (error) {
    console.error('Get presentation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; presId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, presId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const presentation = await db.presentation.findFirst({
      where: { id: presId, workspaceId },
    });
    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, slides } = body;

    const updatedPresentation = await db.presentation.update({
      where: { id: presId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(slides !== undefined && { slides: typeof slides === 'string' ? slides : JSON.stringify(slides) }),
        updatedBy: user.id,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ presentation: updatedPresentation }, { status: 200 });
  } catch (error) {
    console.error('Update presentation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; presId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, presId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const presentation = await db.presentation.findFirst({
      where: { id: presId, workspaceId },
    });
    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
    }

    if (presentation.createdBy !== user.id && member.role !== 'owner' && member.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await db.presentation.delete({ where: { id: presId } });

    return NextResponse.json({ message: 'Presentation deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete presentation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
