import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logActivity } from '@/lib/services/activityService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    const where: Record<string, unknown> = { active: true };
    if (clientId) where.clientId = clientId;

    const templates = await prisma.workflowTemplate.findMany({
      where,
      include: {
        client: true,
        stages: {
          orderBy: { sequence: 'asc' },
          include: {
            taskTemplates: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
        _count: {
          select: { runs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching workflow templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientId,
      name,
      description,
      recurrence = 'MANUAL',
      stages = [],
    } = body;

    if (!clientId || !name) {
      return NextResponse.json({ error: 'Client and Template Name are required' }, { status: 400 });
    }

    const template = await prisma.$transaction(async (tx: any) => {
      const tpl = await tx.workflowTemplate.create({
        data: {
          clientId,
          name,
          description,
          recurrence,
          active: true,
        },
      });

      // Default stages if none provided: DEV -> QA -> PROD
      const stagesToCreate = stages.length > 0 ? stages : [
        { name: 'DEV', environment: 'DEV', sequence: 1, taskTemplates: [] },
        { name: 'QA', environment: 'QA', sequence: 2, taskTemplates: [] },
        { name: 'PROD', environment: 'PROD', sequence: 3, taskTemplates: [] },
      ];

      for (let sIdx = 0; sIdx < stagesToCreate.length; sIdx++) {
        const stageData = stagesToCreate[sIdx];
        const stage = await tx.workflowStage.create({
          data: {
            workflowTemplateId: tpl.id,
            name: stageData.name,
            environment: stageData.environment || 'DEV',
            sequence: stageData.sequence || sIdx + 1,
          },
        });

        if (stageData.taskTemplates && stageData.taskTemplates.length > 0) {
          for (let tIdx = 0; tIdx < stageData.taskTemplates.length; tIdx++) {
            const taskTpl = stageData.taskTemplates[tIdx];
            await tx.taskTemplate.create({
              data: {
                workflowStageId: stage.id,
                name: taskTpl.name,
                description: taskTpl.description,
                sequence: taskTpl.sequence || tIdx + 1,
                defaultAssigneeId: taskTpl.defaultAssigneeId,
                required: taskTpl.required !== undefined ? taskTpl.required : true,
                estimatedMinutes: taskTpl.estimatedMinutes || 30,
              },
            });
          }
        }
      }

      return tpl;
    });

    await logActivity({
      entityType: 'WORKFLOW_TEMPLATE',
      entityId: template.id,
      action: 'CREATED',
      newValue: template.name,
    });

    const fullTemplate = await prisma.workflowTemplate.findUnique({
      where: { id: template.id },
      include: {
        client: true,
        stages: {
          include: { taskTemplates: true },
        },
      },
    });

    return NextResponse.json(fullTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow template:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 400 }
    );
  }
}
