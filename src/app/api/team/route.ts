import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logActivity } from '@/lib/services/activityService';
import { sortByPriority } from '@/lib/utils';

export async function GET() {
  try {
    const members = await prisma.teamMember.findMany({
      where: { active: true },
      include: {
        tasks: {
          include: {
            client: true,
            workflowRun: true,
          },
        },
        timeEntries: {
          orderBy: { startedAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const unassignedTasks = await prisma.task.findMany({
      where: { assigneeId: null },
      include: { client: true, workflowRun: true },
    });

    const enriched = await Promise.all(
      members.map(async (member) => {
        const isLeadUser = member.name.toLowerCase().includes('mohammed');
        const allTasks = isLeadUser
          ? [...member.tasks, ...unassignedTasks.filter((u) => !member.tasks.some((mt) => mt.id === u.id))]
          : member.tasks;

        const sortedTasks = sortByPriority(allTasks);
        const activeTasks = sortedTasks.filter((t) => t.status === 'IN_PROGRESS');
        const waitingTasks = sortedTasks.filter((t) => t.status === 'WAITING_FOR_UPDATE');
        const notStartedTasks = sortedTasks.filter((t) => t.status === 'NOT_STARTED');
        const blockedTasks = sortedTasks.filter((t) => t.status === 'BLOCKED');
        const completedTasks = sortedTasks.filter((t) => t.status === 'COMPLETED');
        const pendingTasks = sortedTasks.filter(
          (t) => t.status === 'NOT_STARTED' || t.status === 'WAITING_FOR_UPDATE'
        );

        // Calculate total time logged
        const totalSeconds = member.timeEntries.reduce((acc, entry) => {
          if (entry.durationSeconds) return acc + entry.durationSeconds;
          if (entry.isRunning) {
            const currentSession = Math.floor((Date.now() - entry.startedAt.getTime()) / 1000);
            return acc + currentSession;
          }
          return acc;
        }, 0);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        const primaryFocusTask =
          activeTasks[0] || blockedTasks[0] || waitingTasks[0] || notStartedTasks[0] || null;

        return {
          id: member.id,
          name: member.name,
          role: member.role,
          email: member.email,
          avatarColor: member.avatarColor,
          activeCount: activeTasks.length,
          waitingCount: waitingTasks.length,
          notStartedCount: notStartedTasks.length,
          blockedCount: blockedTasks.length,
          completedCount: completedTasks.length,
          pendingCount: pendingTasks.length,
          totalCount: sortedTasks.length,
          totalTimeSeconds: totalSeconds,
          totalTimeFormatted: `${hours}h ${minutes}m`,
          currentWork: primaryFocusTask
            ? {
                id: primaryFocusTask.id,
                title: primaryFocusTask.title,
                client: primaryFocusTask.client?.name || 'Internal',
                environment: primaryFocusTask.environment || 'DEV',
                status: primaryFocusTask.status,
                blockReason: primaryFocusTask.blockReason,
              }
            : null,
          isAvailable: activeTasks.length === 0 && blockedTasks.length === 0,
          tasks: sortedTasks,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, email, avatarColor = 'indigo' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const member = await prisma.teamMember.create({
      data: {
        name: name.trim(),
        role: role?.trim() || 'Data / ML Operations',
        email: email?.trim() || null,
        avatarColor,
        active: true,
      },
    });

    await logActivity({
      entityType: 'TEAM_MEMBER',
      entityId: member.id,
      action: 'CREATED',
      newValue: member.name,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create team member' },
      { status: 400 }
    );
  }
}
