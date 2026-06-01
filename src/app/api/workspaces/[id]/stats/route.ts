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

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Total messages this week
    const messagesThisWeek = await db.message.count({
      where: {
        workspaceId,
        isDeleted: false,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Messages last week (for trend calculation)
    const messagesLastWeek = await db.message.count({
      where: {
        workspaceId,
        isDeleted: false,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    });

    // Active members (who sent messages in last 7 days)
    const activeMembersThisWeek = await db.message.findMany({
      where: {
        workspaceId,
        isDeleted: false,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const activeMembersLastWeek = await db.message.findMany({
      where: {
        workspaceId,
        isDeleted: false,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    // Documents created this week
    const documentsThisWeek = await db.document.count({
      where: {
        workspaceId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const documentsLastWeek = await db.document.count({
      where: {
        workspaceId,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    });

    // Tasks completed this week and total tasks
    const tasksCompletedThisWeek = await db.task.count({
      where: {
        workspaceId,
        status: 'done',
        updatedAt: { gte: sevenDaysAgo },
      },
    });

    const tasksCompletedLastWeek = await db.task.count({
      where: {
        workspaceId,
        status: 'done',
        updatedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    });

    const totalTasks = await db.task.count({
      where: { workspaceId },
    });

    const completedTasks = await db.task.count({
      where: { workspaceId, status: 'done' },
    });

    const inProgressTasks = await db.task.count({
      where: { workspaceId, status: 'in_progress' },
    });

    const todoTasks = await db.task.count({
      where: { workspaceId, status: 'todo' },
    });

    // Channel activity breakdown
    const channels = await db.channel.findMany({
      where: { workspaceId, archived: false },
      include: {
        _count: {
          select: {
            messages: {
              where: {
                isDeleted: false,
                createdAt: { gte: sevenDaysAgo },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const channelActivity = channels.map((ch) => ({
      id: ch.id,
      name: ch.name,
      messageCount: ch._count.messages,
    }));

    // Total members
    const totalMembers = await db.workspaceMember.count({
      where: { workspaceId },
    });

    // Total channels
    const totalChannels = channels.length;

    // Total documents
    const totalDocuments = await db.document.count({
      where: { workspaceId },
    });

    // Calculate trend percentages
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return NextResponse.json({
      stats: {
        messagesThisWeek,
        messagesLastWeek,
        messagesTrend: calculateTrend(messagesThisWeek, messagesLastWeek),
        activeMembers: activeMembersThisWeek.length,
        activeMembersLastWeek: activeMembersLastWeek.length,
        activeMembersTrend: calculateTrend(activeMembersThisWeek.length, activeMembersLastWeek.length),
        documentsThisWeek,
        documentsLastWeek,
        documentsTrend: calculateTrend(documentsThisWeek, documentsLastWeek),
        tasksCompletedThisWeek,
        tasksCompletedLastWeek,
        tasksCompletedTrend: calculateTrend(tasksCompletedThisWeek, tasksCompletedLastWeek),
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        totalMembers,
        totalChannels,
        totalDocuments,
        channelActivity,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Workspace stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
