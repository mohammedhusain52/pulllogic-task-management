import { NextResponse } from 'next/server';
import { prisma, ensureBaselineData } from '@/lib/db';
import { getDashboardMetrics, getFollowUpsRequired } from '@/lib/services/followUpService';
import { syncAutomatedNotifications } from '@/lib/services/notificationService';
import { sortByPriority } from '@/lib/utils';

export async function GET() {
  try {
    await ensureBaselineData();
    // Run automated notification check
    await syncAutomatedNotifications();

    const metrics = await getDashboardMetrics();
    const followUps = await getFollowUpsRequired();

    // "Ongoing Tasks" - Prioritized Critical -> High -> Medium -> Low
    const rawTodayTasks = await prisma.task.findMany({
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
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
      },
    });

    // Sort strictly Critical -> High -> Medium -> Low -> Due Date
    const todayTasks = sortByPriority(rawTodayTasks).slice(0, 25);

    // Team Overview - Include all tasks to report every status
    const teamMembers = await prisma.teamMember.findMany({
      where: { active: true },
      include: {
        tasks: {
          include: { client: true },
        },
        timeEntries: {
          where: {
            startedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        },
      },
    });

    const teamOverview = teamMembers.map((member) => {
      const activeTasks = member.tasks.filter((t) => t.status === 'IN_PROGRESS');
      const waitingTasks = member.tasks.filter((t) => t.status === 'WAITING_FOR_UPDATE');
      const notStartedTasks = member.tasks.filter((t) => t.status === 'NOT_STARTED');
      const blockedTasks = member.tasks.filter((t) => t.status === 'BLOCKED');
      const completedTasks = member.tasks.filter((t) => t.status === 'COMPLETED');
      const pendingTasks = member.tasks.filter(
        (t) => t.status === 'NOT_STARTED' || t.status === 'WAITING_FOR_UPDATE'
      );

      const currentWork = activeTasks[0] || null;

      // Calculate time today
      const totalSecondsToday = member.timeEntries.reduce((acc, entry) => {
        if (entry.durationSeconds) return acc + entry.durationSeconds;
        if (entry.isRunning) {
          const session = Math.floor((Date.now() - entry.startedAt.getTime()) / 1000);
          return acc + session;
        }
        return acc;
      }, 0);

      const hours = Math.floor(totalSecondsToday / 3600);
      const minutes = Math.floor((totalSecondsToday % 3600) / 60);
      const formattedTime = `${hours}h ${minutes}m`;

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        avatarColor: member.avatarColor,
        activeCount: activeTasks.length,
        waitingCount: waitingTasks.length,
        notStartedCount: notStartedTasks.length,
        blockedCount: blockedTasks.length,
        completedCount: completedTasks.length,
        pendingCount: pendingTasks.length,
        totalCount: member.tasks.length,
        currentWork: currentWork
          ? {
              id: currentWork.id,
              title: currentWork.title,
              client: currentWork.client?.name || 'Internal',
              environment: currentWork.environment,
            }
          : null,
        timeToday: formattedTime,
        isAvailable: activeTasks.length === 0,
      };
    });

    // Upcoming Recurring Workflows
    const recurringTemplates = await prisma.workflowTemplate.findMany({
      where: {
        active: true,
        recurrence: { not: 'MANUAL' },
      },
      include: {
        client: true,
      },
    });

    // Recent Active Workflow Runs
    const activeWorkflowRuns = await prisma.workflowRun.findMany({
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        client: true,
        workflowTemplate: true,
        tasks: {
          select: {
            id: true,
            status: true,
            environment: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      metrics,
      myWorkToday: todayTasks,
      followUps,
      teamOverview,
      recurringTemplates,
      activeWorkflowRuns,
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
