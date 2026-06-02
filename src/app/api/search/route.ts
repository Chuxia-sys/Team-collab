import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { getFirestoreApp } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const workspaceId = searchParams.get('workspaceId') || '';

    if (!q.trim() || q.trim().length < 2) {
      return NextResponse.json({ results: {} }, { status: 200 });
    }

    const queryStr = q.trim().toLowerCase();
    const results: Record<string, unknown[]> = {};
    const firestore = getFirestoreApp();

    // Helper to search subcollection items by title/name
    async function searchSubcollection(parentCollection: string, parentId: string, subCol: string, searchField: string, searchValue: string, take: number = 5): Promise<any[]> {
      try {
        const colRef = collection(firestore, `${parentCollection}/${parentId}/${subCol}`);
        const q = query(colRef, limit(take * 3)); // Fetch extra for in-memory filtering
        const snap = await getDocs(q);
        const items: any[] = [];
        for (const d of snap.docs) {
          const data = d.data();
          const fieldValue = (data[searchField] || '').toString().toLowerCase();
          if (fieldValue.includes(searchValue)) {
            items.push({ id: d.id, ...data });
            if (items.length >= take) break;
          }
        }
        return items;
      } catch {
        return [];
      }
    }

    // Determine which workspaces to search
    let workspaceIds: string[] = [];
    if (workspaceId) {
      workspaceIds = [workspaceId];
    } else {
      // Find workspaces where user is a member
      const allWs = await db.workspace.findMany({} as any);
      for (const ws of allWs) {
        const wid = (ws as any).id;
        try {
          const memberRef = doc(firestore, `workspaces/${wid}/members/${user.id}`);
          const memberSnap = await getDoc(memberRef);
          if (memberSnap.exists()) {
            workspaceIds.push(wid);
          }
        } catch {
          // skip
        }
      }
    }

    // Search channels
    const channelsResults: any[] = [];
    for (const wid of workspaceIds) {
      const chs = await searchSubcollection('workspaces', wid, 'channels', 'name', queryStr);
      const nonArchived = chs.filter((ch: any) => !ch.archived);
      // Fetch workspace name
      for (const ch of nonArchived) {
        try {
          const wsDoc = await getDoc(doc(firestore, `workspaces/${wid}`));
          ch.workspace = wsDoc.exists() ? { name: wsDoc.data().name } : { name: 'Unknown' };
        } catch { ch.workspace = { name: 'Unknown' }; }
      }
      channelsResults.push(...nonArchived.slice(0, 5));
    }
    results.channels = channelsResults.slice(0, 5);

    // Search documents
    const docResults: any[] = [];
    for (const wid of workspaceIds) {
      const docs = await searchSubcollection('workspaces', wid, 'documents', 'title', queryStr);
      for (const d of docs) {
        try {
          const wsDoc = await getDoc(doc(firestore, `workspaces/${wid}`));
          d.workspace = wsDoc.exists() ? { name: wsDoc.data().name } : { name: 'Unknown' };
        } catch { d.workspace = { name: 'Unknown' }; }
      }
      docResults.push(...docs.slice(0, 5));
    }
    results.documents = docResults.slice(0, 5);

    // Search spreadsheets
    const sheetResults: any[] = [];
    for (const wid of workspaceIds) {
      const sheets = await searchSubcollection('workspaces', wid, 'spreadsheets', 'title', queryStr);
      for (const s of sheets) {
        try {
          const wsDoc = await getDoc(doc(firestore, `workspaces/${wid}`));
          s.workspace = wsDoc.exists() ? { name: wsDoc.data().name } : { name: 'Unknown' };
        } catch { s.workspace = { name: 'Unknown' }; }
      }
      sheetResults.push(...sheets.slice(0, 5));
    }
    results.spreadsheets = sheetResults.slice(0, 5);

    // Search presentations
    const presResults: any[] = [];
    for (const wid of workspaceIds) {
      const pres = await searchSubcollection('workspaces', wid, 'presentations', 'title', queryStr);
      for (const p of pres) {
        try {
          const wsDoc = await getDoc(doc(firestore, `workspaces/${wid}`));
          p.workspace = wsDoc.exists() ? { name: wsDoc.data().name } : { name: 'Unknown' };
        } catch { p.workspace = { name: 'Unknown' }; }
      }
      presResults.push(...pres.slice(0, 5));
    }
    results.presentations = presResults.slice(0, 5);
    results.presentations = presentations;

    // Search tasks
    const tasks = await db.task.findMany({
      where: {
        ...workspaceFilter,
        OR: [
          { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
        ],
      },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        workspaceId: true,
        workspace: { select: { name: true } },
      },
    });
    results.tasks = tasks;

    // Search members (users in the same workspace)
    const memberWhereClause = workspaceId
      ? { workspaces: { some: { workspaceId } } }
      : { workspaces: { some: { workspace: { members: { some: { userId: user.id } } } } } };

    const members = await db.user.findMany({
      where: {
        ...memberWhereClause,
        name: { contains: query, mode: Prisma.QueryMode.insensitive },
        id: { not: user.id },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
      },
    });
    results.members = members;

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
