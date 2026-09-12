import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getWorkflowRunDetails } from '@/lib/services/workflowService';
import { logActivity } from '@/lib/services/activityService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const run = await getWorkflowRunDetails(id);
    if (!run) {
      return NextResponse.json({ error: 'Workflow run not found' }, { status: 404 });
    }
    return NextResponse.json(run);
  } catch (error) {
    console.error('Error fetching workflow run details:', error);
    return NextResponse.json({ error: 'Failed to fetch workflow run details' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, currentStage } = body;

    const data: Record<string, unknown> = {};
    if (status) {
      data.status = status;
      if (status === 'COMPLETED') data.completedAt = new Date();
    }
    if (currentStage) data.currentStage = currentStage;

    const updated = await prisma.workflowRun.update({
      where: { id },
      data,
    });

    await logActivity({
      entityType: 'WORKFLOW_RUN',
      entityId: id,
      action: 'STATUS_CHANGED',
      newValue: status || currentStage,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating workflow run:', error);
    return NextResponse.json({ error: 'Failed to update workflow run' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.workflowRun.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow run:', error);
    return NextResponse.json({ error: 'Failed to delete workflow run' }, { status: 500 });
  }
}
