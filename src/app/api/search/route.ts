import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

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

    const query = q.trim();
    const results: Record<string, unknown[]> = {};

    // Build workspace filter if specified
    const workspaceFilter = workspaceId
      ? { workspaceId }
      : {
          workspace: {
            members: { some: { userId: user.id } },
          },
        };

    // Search channels
    const channels = await db.channel.findMany({
      where: {
        ...workspaceFilter,
        name: { contains: query, mode: Prisma.QueryMode.insensitive },
        archived: false,
      },
      take: 5,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        workspaceId: true,
        workspace: { select: { name: true } },
      },
    });
    results.channels = channels;

    // Search documents
    const documents = await db.document.findMany({
      where: {
        ...workspaceFilter,
        title: { contains: query, mode: Prisma.QueryMode.insensitive },
      },
      take: 5,
      select: {
        id: true,
        title: true,
        workspaceId: true,
        updatedAt: true,
        workspace: { select: { name: true } },
      },
    });
    results.documents = documents;

    // Search spreadsheets
    const spreadsheets = await db.spreadsheet.findMany({
      where: {
        ...workspaceFilter,
        title: { contains: query, mode: Prisma.QueryMode.insensitive },
      },
      take: 5,
      select: {
        id: true,
        title: true,
        workspaceId: true,
        updatedAt: true,
        workspace: { select: { name: true } },
      },
    });
    results.spreadsheets = spreadsheets;

    // Search presentations
    const presentations = await db.presentation.findMany({
      where: {
        ...workspaceFilter,
        title: { contains: query, mode: Prisma.QueryMode.insensitive },
      },
      take: 5,
      select: {
        id: true,
        title: true,
        workspaceId: true,
        updatedAt: true,
        workspace: { select: { name: true } },
      },
    });
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
