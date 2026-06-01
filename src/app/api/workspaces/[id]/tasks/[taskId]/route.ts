import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, taskId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const task = await db.task.findFirst({
      where: { id: taskId, workspaceId },
    });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, status, priority, assigneeId, dueDate, tags, order } = body;

    if (assigneeId !== undefined && assigneeId !== null) {
      const assigneeMember = await requireWorkspaceMember(workspaceId, assigneeId);
      if (!assigneeMember) {
        return NextResponse.json({ error: 'Assignee is not a member of this workspace' }, { status: 400 });
      }
    }

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(tags !== undefined && { tags }),
        ...(order !== undefined && { order }),
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

    if (assigneeId && assigneeId !== task.assigneeId && assigneeId !== user.id) {
      await db.notification.create({
        data: {
          userId: assigneeId,
          type: 'task_assigned',
          title: 'Task Assigned',
          message: `${user.name} assigned you a task: ${updatedTask.title}`,
          actorId: user.id,
          workspaceId,
        },
      });
    }

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: workspaceId, taskId } = await params;
    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const task = await db.task.findFirst({
      where: { id: taskId, workspaceId },
    });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.createdBy !== user.id && task.assigneeId !== user.id && member.role !== 'owner' && member.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await db.task.delete({ where: { id: taskId } });

    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
