import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logActivity } from '@/lib/services/activityService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        workflowTemplates: {
          include: {
            stages: {
              include: {
                taskTemplates: true,
              },
            },
          },
        },
        workflowRuns: {
          orderBy: { startedAt: 'desc' },
          include: {
            workflowTemplate: true,
          },
        },
        tasks: {
          include: {
            assignee: true,
            workflowRun: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const activityHistory = await prisma.activityLog.findMany({
      where: {
        OR: [
          { entityType: 'CLIENT', entityId: id },
          { entityId: { in: client.tasks.map((t) => t.id) } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      ...client,
      activityHistory,
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json({ error: 'Failed to fetch client details' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, active } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description ? description.trim() : null;
    if (active !== undefined) data.active = active;

    const updated = await prisma.client.update({
      where: { id },
      data,
    });

    await logActivity({
      entityType: 'CLIENT',
      entityId: id,
      action: 'STATUS_CHANGED',
      newValue: updated.name,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
