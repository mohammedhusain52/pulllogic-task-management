import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logActivity } from '@/lib/services/activityService';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      where: { active: true },
      include: {
        workflowTemplates: {
          include: {
            stages: true,
          },
        },
        workflowRuns: {
          take: 3,
          orderBy: { startedAt: 'desc' },
        },
        tasks: {
          select: {
            id: true,
            type: true,
            status: true,
            priority: true,
            assignee: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enriched = clients.map((client) => {
      const activeTasks = client.tasks.filter((t) => t.type === 'TASK' && !['COMPLETED', 'CANCELLED'].includes(t.status));
      const pendingTasks = client.tasks.filter((t) => t.status === 'NOT_STARTED' || t.status === 'WAITING_FOR_UPDATE');
      const blockedTasks = client.tasks.filter((t) => t.status === 'BLOCKED');
      const bugs = client.tasks.filter((t) => t.type === 'BUG' && !['RESOLVED', 'CLOSED'].includes(t.status));
      const issues = client.tasks.filter((t) => t.type === 'ISSUE' && !['COMPLETED', 'CANCELLED'].includes(t.status));
      const features = client.tasks.filter((t) => t.type === 'FEATURE' && !['RELEASED', 'CANCELLED'].includes(t.status));

      return {
        ...client,
        activeTasksCount: activeTasks.length,
        pendingTasksCount: pendingTasks.length,
        blockedTasksCount: blockedTasks.length,
        bugsCount: bugs.length,
        issuesCount: issues.length,
        featuresCount: features.length,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const existing = await prisma.client.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Client with this name already exists' }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        active: true,
      },
    });

    await logActivity({
      entityType: 'CLIENT',
      entityId: client.id,
      action: 'CREATED',
      newValue: client.name,
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create client' },
      { status: 400 }
    );
  }
}
