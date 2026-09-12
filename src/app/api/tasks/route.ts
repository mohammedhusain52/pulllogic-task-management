import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createTask } from '@/lib/services/taskService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const clientId = searchParams.get('clientId');
    const assigneeId = searchParams.get('assigneeId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const environment = searchParams.get('environment');
    const search = searchParams.get('search');
    const workflowRunId = searchParams.get('workflowRunId');

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (clientId) where.clientId = clientId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (environment) where.environment = environment;
    if (workflowRunId) where.workflowRunId = workflowRunId;

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { client: { name: { contains: search } } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        client: true,
        assignee: true,
        workflowRun: {
          include: {
            workflowTemplate: true,
          },
        },
        timeEntries: {
          where: { isRunning: true },
        },
        _count: {
          select: {
            subTasks: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const task = await createTask(body);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 400 }
    );
  }
}
