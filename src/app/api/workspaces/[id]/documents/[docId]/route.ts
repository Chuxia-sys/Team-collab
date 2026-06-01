import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, docId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const document = await db.document.findFirst({
      where: { id: docId, workspaceId },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document }, { status: 200 });
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, docId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const document = await db.document.findFirst({
      where: { id: docId, workspaceId },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, tags, folder } = body;

    const updatedDocument = await db.document.update({
      where: { id: docId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(tags !== undefined && { tags }),
        ...(folder !== undefined && { folder: folder?.trim() || null }),
        updatedBy: user.id,
        version: { increment: 1 },
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ document: updatedDocument }, { status: 200 });
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, docId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const document = await db.document.findFirst({
      where: { id: docId, workspaceId },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.createdBy !== user.id && member.role !== 'owner' && member.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await db.document.delete({ where: { id: docId } });

    return NextResponse.json({ message: 'Document deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
