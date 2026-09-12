import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logActivity } from '@/lib/services/activityService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const member = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            client: true,
            workflowRun: true,
          },
          orderBy: { priority: 'desc' },
        },
        timeEntries: {
          include: {
            task: true,
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching team member:', error);
    return NextResponse.json({ error: 'Failed to fetch team member' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, role, email, avatarColor, active } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (role !== undefined) data.role = role ? role.trim() : null;
    if (email !== undefined) data.email = email ? email.trim() : null;
    if (avatarColor !== undefined) data.avatarColor = avatarColor;
    if (active !== undefined) data.active = active;

    const updated = await prisma.teamMember.update({
      where: { id },
      data,
    });

    await logActivity({
      entityType: 'TEAM_MEMBER',
      entityId: id,
      action: 'STATUS_CHANGED',
      newValue: updated.name,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.teamMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
  }
}
