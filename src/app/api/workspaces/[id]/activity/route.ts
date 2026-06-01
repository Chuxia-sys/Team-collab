import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';

interface ActivityItem {
  id: string;
  type: 'channel_created' | 'member_joined' | 'document_created' | 'spreadsheet_created' | 'presentation_created' | 'task_completed' | 'task_assigned' | 'message_sent';
  description: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

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

    const activities: ActivityItem[] = [];

    // Recent channels created
    const recentChannels = await db.channel.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { workspace: { select: { name: true } } },
    });

    for (const ch of recentChannels) {
      const creator = await db.user.findUnique({
        where: { id: ch.createdBy },
        select: { name: true },
      });
      activities.push({
        id: `channel-${ch.id}`,
        type: 'channel_created',
        description: `created channel #${ch.name}`,
        userName: creator?.name || 'Someone',
        timestamp: ch.createdAt.toISOString(),
        metadata: { channelId: ch.id, channelName: ch.name },
      });
    }

    // Recent members joined
    const recentMembers = await db.workspaceMember.findMany({
      where: { workspaceId },
      orderBy: { joinedAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true } } },
    });

    for (const m of recentMembers) {
      activities.push({
        id: `member-${m.id}`,
        type: 'member_joined',
        description: `joined the workspace`,
        userName: m.user?.name || 'Someone',
        timestamp: m.joinedAt.toISOString(),
      });
    }

    // Recent documents created
    const recentDocs = await db.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { creator: { select: { name: true } } },
    });

    for (const doc of recentDocs) {
      activities.push({
        id: `document-${doc.id}`,
        type: 'document_created',
        description: `created document "${doc.title}"`,
        userName: doc.creator?.name || 'Someone',
        timestamp: doc.createdAt.toISOString(),
        metadata: { documentId: doc.id, documentTitle: doc.title },
      });
    }

    // Recent spreadsheets created
    const recentSheets = await db.spreadsheet.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { creator: { select: { name: true } } },
    });

    for (const sheet of recentSheets) {
      activities.push({
        id: `spreadsheet-${sheet.id}`,
        type: 'spreadsheet_created',
        description: `created spreadsheet "${sheet.title}"`,
        userName: sheet.creator?.name || 'Someone',
        timestamp: sheet.createdAt.toISOString(),
        metadata: { spreadsheetId: sheet.id, spreadsheetTitle: sheet.title },
      });
    }

    // Recent presentations created
    const recentPres = await db.presentation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { creator: { select: { name: true } } },
    });

    for (const pres of recentPres) {
      activities.push({
        id: `presentation-${pres.id}`,
        type: 'presentation_created',
        description: `created presentation "${pres.title}"`,
        userName: pres.creator?.name || 'Someone',
        timestamp: pres.createdAt.toISOString(),
        metadata: { presentationId: pres.id, presentationTitle: pres.title },
      });
    }

    // Recent tasks completed
    const recentCompletedTasks = await db.task.findMany({
      where: { workspaceId, status: 'done' },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        creator: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    });

    for (const task of recentCompletedTasks) {
      activities.push({
        id: `task-completed-${task.id}`,
        type: 'task_completed',
        description: `completed task "${task.title}"`,
        userName: task.assignee?.name || task.creator?.name || 'Someone',
        timestamp: task.updatedAt.toISOString(),
        metadata: { taskId: task.id, taskTitle: task.title },
      });
    }

    // Recent tasks assigned
    const recentAssignedTasks = await db.task.findMany({
      where: { workspaceId, assigneeId: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        creator: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    });

    for (const task of recentAssignedTasks) {
      if (task.assignee) {
        activities.push({
          id: `task-assigned-${task.id}`,
          type: 'task_assigned',
          description: `assigned task "${task.title}" to ${task.assignee.name}`,
          userName: task.creator?.name || 'Someone',
          timestamp: task.updatedAt.toISOString(),
          metadata: { taskId: task.id, taskTitle: task.title, assigneeName: task.assignee.name },
        });
      }
    }

    // Messages count by day for the last 7 days (aggregated)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const messageGroups = await db.message.findMany({
      where: {
        workspaceId,
        isDeleted: false,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        userId: true,
        author: { select: { name: true } },
      },
    });

    // Group messages by day
    const messagesByDay: Record<string, number> = {};
    const messageUserCounts: Record<string, Set<string>> = {};

    for (const msg of messageGroups) {
      const dayKey = msg.createdAt.toISOString().split('T')[0];
      messagesByDay[dayKey] = (messagesByDay[dayKey] || 0) + 1;
      if (!messageUserCounts[dayKey]) messageUserCounts[dayKey] = new Set();
      messageUserCounts[dayKey].add(msg.userId);
    }

    // Add aggregated message activity for each day with messages
    for (const [day, count] of Object.entries(messagesByDay)) {
      const activeUsers = messageUserCounts[day]?.size || 0;
      activities.push({
        id: `messages-${day}`,
        type: 'message_sent',
        description: `${count} message${count !== 1 ? 's' : ''} sent by ${activeUsers} member${activeUsers !== 1 ? 's' : ''}`,
        userName: 'Workspace',
        timestamp: new Date(day + 'T23:59:59.999Z').toISOString(),
        metadata: { count, activeUsers, day },
      });
    }

    // Sort all activities by timestamp (most recent first) and take top 20
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ activities: activities.slice(0, 20) }, { status: 200 });
  } catch (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
