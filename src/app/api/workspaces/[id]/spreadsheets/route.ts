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

    const spreadsheets = await db.spreadsheet.findMany({
      where: { workspaceId },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ spreadsheets }, { status: 200 });
  } catch (error) {
    console.error('List spreadsheets error:', error);
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
    const { title, columns, rows } = body;

    const spreadsheet = await db.spreadsheet.create({
      data: {
        title: title?.trim() || 'Untitled Spreadsheet',
        columns: typeof columns === 'string' ? columns : JSON.stringify(columns || []),
        rows: typeof rows === 'string' ? rows : JSON.stringify(rows || []),
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

    return NextResponse.json({ spreadsheet }, { status: 201 });
  } catch (error) {
    console.error('Create spreadsheet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
