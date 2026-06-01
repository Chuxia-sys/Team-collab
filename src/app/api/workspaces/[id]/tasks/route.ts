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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');

    const where: Record<string, unknown> = { workspaceId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await db.task.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        assignee: {
          select: { id: true, name: true, avatar: true, status: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error('List tasks error:', error);
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
    const { title, description, status, priority, assigneeId, dueDate, tags, parentId, order } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    // Verify assignee is a member of the workspace
    if (assigneeId) {
      const assigneeMember = await requireWorkspaceMember(workspaceId, assigneeId);
      if (!assigneeMember) {
        return NextResponse.json({ error: 'Assignee is not a member of this workspace' }, { status: 400 });
      }
    }

    const task = await db.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        status: status || 'todo',
        priority: priority || 'medium',
        assigneeId: assigneeId || null,
        createdBy: user.id,
        workspaceId,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags || '',
        parentId: parentId || null,
        order: order ?? 0,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        assignee: {
          select: { id: true, name: true, avatar: true, status: true },
        },
      },
    });

    // Create notification for assignee
    if (assigneeId && assigneeId !== user.id) {
      await db.notification.create({
        data: {
          userId: assigneeId,
          type: 'task_assigned',
          title: 'Task Assigned',
          message: `${user.name} assigned you a task: ${title.trim()}`,
          actorId: user.id,
          workspaceId,
        },
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
