import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateWorkflowRun } from '@/lib/services/workflowService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const runs = await prisma.workflowRun.findMany({
      where,
      include: {
        client: true,
        workflowTemplate: {
          include: {
            stages: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            environment: true,
            assignee: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error('Error fetching workflow runs:', error);
    return NextResponse.json({ error: 'Failed to fetch workflow runs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workflowTemplateId, period, customAssigneeId, name } = body;

    if (!workflowTemplateId || !period) {
      return NextResponse.json(
        { error: 'workflowTemplateId and period are required' },
        { status: 400 }
      );
    }

    const run = await generateWorkflowRun({
      workflowTemplateId,
      period,
      customAssigneeId,
      name,
    });

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow run:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate workflow run' },
      { status: 400 }
    );
  }
}
