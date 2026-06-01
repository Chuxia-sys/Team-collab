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

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');
    const tags = searchParams.get('tags');

    const where: Record<string, unknown> = { workspaceId };
    if (folder) where.folder = folder;
    if (tags) where.tags = { contains: tags };

    const documents = await db.document.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ documents }, { status: 200 });
  } catch (error) {
    console.error('List documents error:', error);
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
    const { title, content, tags, folder } = body;

    const document = await db.document.create({
      data: {
        title: title?.trim() || 'Untitled Document',
        content: content || '',
        tags: tags || '',
        folder: folder?.trim() || null,
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

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Create document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
