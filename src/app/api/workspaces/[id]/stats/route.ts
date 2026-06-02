import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireWorkspaceMember } from '@/lib/auth';
import { getFirestoreApp } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

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

    const firestore = getFirestoreApp();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    // Helper: count items in a subcollection with optional in-memory date filtering
    async function countWithDateFilter(colPath: string, dateField: string, minTs: number, maxTs?: number): Promise<number> {
      try {
        const colRef = collection(firestore, colPath);
        const snap = await getDocs(colRef);
        let count = 0;
        for (const d of snap.docs) {
          const data = d.data();
          const ts = data[dateField];
          if (ts) {
            const ms = typeof ts === 'object' && ts.toDate ? ts.toDate().getTime() : new Date(ts as string).getTime();
            if (ms >= minTs && (maxTs === undefined || ms < maxTs)) count++;
          }
        }
        return count;
      } catch { return 0; }
    }

    // Helper: get unique userIds from messages
    async function getActiveUsers(colPath: string, minTs: number, maxTs?: number): Promise<Set<string>> {
      const userIds = new Set<string>();
      try {
        const colRef = collection(firestore, colPath);
        const snap = await getDocs(colRef);
        for (const d of snap.docs) {
          const data = d.data();
          const ts = data.createdAt;
          if (ts) {
            const ms = typeof ts === 'object' && ts.toDate ? ts.toDate().getTime() : new Date(ts as string).getTime();
            if (ms >= minTs && (maxTs === undefined || ms < maxTs) && data.userId) {
              userIds.add(data.userId);
            }
          }
        }
      } catch { /* ignore */ }
      return userIds;
    }

    // Fetch all channel message counts
    let messagesThisWeek = 0;
    let messagesLastWeek = 0;
    const activeUsersThisWeek = new Set<string>();
    const activeUsersLastWeek = new Set<string>();

    const channelsSnap = await getDocs(collection(firestore, `workspaces/${workspaceId}/channels`));
    for (const chDoc of channelsSnap.docs) {
      const chId = chDoc.id;
      const msgPath = `workspaces/${workspaceId}/channels/${chId}/messages`;
      messagesThisWeek += await countWithDateFilter(msgPath, 'createdAt', sevenDaysAgo);
      messagesLastWeek += await countWithDateFilter(msgPath, 'createdAt', fourteenDaysAgo, sevenDaysAgo);

      const thisWeekUsers = await getActiveUsers(msgPath, sevenDaysAgo);
      const lastWeekUsers = await getActiveUsers(msgPath, fourteenDaysAgo, sevenDaysAgo);
      thisWeekUsers.forEach(u => activeUsersThisWeek.add(u));
      lastWeekUsers.forEach(u => activeUsersLastWeek.add(u));
    }

    // Documents created
    const docPath = `workspaces/${workspaceId}/documents`;
    const documentsThisWeek = await countWithDateFilter(docPath, 'createdAt', sevenDaysAgo);
    const documentsLastWeek = await countWithDateFilter(docPath, 'createdAt', fourteenDaysAgo, sevenDaysAgo);

    // Tasks
    const taskPath = `workspaces/${workspaceId}/tasks`;
    const tasksCompletedThisWeek = await countWithDateFilter(taskPath, 'updatedAt', sevenDaysAgo);
    const tasksCompletedLastWeek = await countWithDateFilter(taskPath, 'updatedAt', fourteenDaysAgo, sevenDaysAgo);
    const totalTasks = await countWithDateFilter(taskPath, 'createdAt', 0);

    // Task counts
    const allTasks = await db.task.findMany({ where: { workspaceId } as any });
    const taskList = allTasks as any[];
    const completedTasks = taskList.filter(t => t.status === 'done').length;
    const inProgressTasks = taskList.filter(t => t.status === 'in_progress').length;
    const todoTasks = taskList.filter(t => t.status === 'todo').length;

    // Channel activity breakdown (with message counts this week)
    const channels = await db.channel.findMany({
      where: { workspaceId, archived: false } as any,
      orderBy: { createdAt: 'asc' } as any,
    });
    const channelList = channels as any[];

    const channelActivity: { id: string; name: string; messageCount: number }[] = [];
    for (const ch of channelList) {
      const msgPath = `workspaces/${workspaceId}/channels/${ch.id}/messages`;
      const msgCount = await countWithDateFilter(msgPath, 'createdAt', sevenDaysAgo);
      channelActivity.push({ id: ch.id, name: ch.name, messageCount: msgCount });
    }

    // Count members
    const totalMembers = (await getDocs(collection(firestore, `workspaces/${workspaceId}/members`))).size;

    // Total channels
    const totalChannels = channelList.length;

    // Total documents
    const totalDocuments = (await getDocs(collection(firestore, `workspaces/${workspaceId}/documents`))).size;

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
        activeMembers: activeUsersThisWeek.size,
        activeMembersLastWeek: activeUsersLastWeek.size,
        activeMembersTrend: calculateTrend(activeUsersThisWeek.size, activeUsersLastWeek.size),
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
