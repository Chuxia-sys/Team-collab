import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sheetId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, sheetId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const spreadsheet = await db.spreadsheet.findFirst({
      where: { id: sheetId, workspaceId },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!spreadsheet) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 404 });
    }

    return NextResponse.json({ spreadsheet }, { status: 200 });
  } catch (error) {
    console.error('Get spreadsheet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sheetId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, sheetId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const spreadsheet = await db.spreadsheet.findFirst({
      where: { id: sheetId, workspaceId },
    });
    if (!spreadsheet) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, columns, rows } = body;

    const updatedSpreadsheet = await db.spreadsheet.update({
      where: { id: sheetId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(columns !== undefined && { columns: typeof columns === 'string' ? columns : JSON.stringify(columns) }),
        ...(rows !== undefined && { rows: typeof rows === 'string' ? rows : JSON.stringify(rows) }),
        updatedBy: user.id,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ spreadsheet: updatedSpreadsheet }, { status: 200 });
  } catch (error) {
    console.error('Update spreadsheet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sheetId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, sheetId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const spreadsheet = await db.spreadsheet.findFirst({
      where: { id: sheetId, workspaceId },
    });
    if (!spreadsheet) {
      return NextResponse.json({ error: 'Spreadsheet not found' }, { status: 404 });
    }

    if (spreadsheet.createdBy !== user.id && member.role !== 'owner' && member.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await db.spreadsheet.delete({ where: { id: sheetId } });

    return NextResponse.json({ message: 'Spreadsheet deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete spreadsheet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
