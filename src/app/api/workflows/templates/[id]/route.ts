import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logActivity } from '@/lib/services/activityService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
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
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, recurrence, active } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description ? description.trim() : null;
    if (recurrence !== undefined) data.recurrence = recurrence;
    if (active !== undefined) data.active = active;

    const updated = await prisma.workflowTemplate.update({
      where: { id },
      data,
    });

    await logActivity({
      entityType: 'WORKFLOW_TEMPLATE',
      entityId: id,
      action: 'UPDATED',
      newValue: updated.name,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await prisma.workflowTemplate.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Delete associated stages and task templates cascade
    await prisma.$transaction(async (tx: any) => {
      const stages = await tx.workflowStage.findMany({ where: { workflowTemplateId: id } });
      for (const st of stages) {
        await tx.taskTemplate.deleteMany({ where: { workflowStageId: st.id } });
      }
      await tx.workflowStage.deleteMany({ where: { workflowTemplateId: id } });
      await tx.workflowTemplate.delete({ where: { id } });
    });

    await logActivity({
      entityType: 'WORKFLOW_TEMPLATE',
      entityId: id,
      action: 'DELETED',
      oldValue: template.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
