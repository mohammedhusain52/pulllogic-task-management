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
    const unassignedTasks = await prisma.task.findMany({
      where: {
        assigneeId: null,
      },
      include: { client: true },
    });

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
      const isLeadUser = member.name.toLowerCase().includes('mohammed');
      const allMemberTasks = isLeadUser
        ? [...member.tasks, ...unassignedTasks.filter((u) => !member.tasks.some((mt) => mt.id === u.id))]
        : member.tasks;

      const activeTasks = allMemberTasks.filter((t) => t.status === 'IN_PROGRESS');
      const waitingTasks = allMemberTasks.filter((t) => t.status === 'WAITING_FOR_UPDATE');
      const notStartedTasks = allMemberTasks.filter((t) => t.status === 'NOT_STARTED');
      const blockedTasks = allMemberTasks.filter((t) => t.status === 'BLOCKED');
      const completedTasks = allMemberTasks.filter((t) => t.status === 'COMPLETED');
      const pendingTasks = allMemberTasks.filter(
        (t) => t.status === 'NOT_STARTED' || t.status === 'WAITING_FOR_UPDATE'
      );

      // Focus task prioritizes active, then blocked, then waiting, then planned
      const focusTask =
        activeTasks[0] || blockedTasks[0] || waitingTasks[0] || notStartedTasks[0] || null;

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
        totalCount: allMemberTasks.length,
        currentWork: focusTask
          ? {
              id: focusTask.id,
              title: focusTask.title,
              client: focusTask.client?.name || 'Internal',
              environment: focusTask.environment,
              status: focusTask.status,
              priority: focusTask.priority,
              blockReason: focusTask.blockReason,
              waitingReason: focusTask.waitingReason,
            }
          : null,
        timeToday: formattedTime,
        isAvailable: activeTasks.length === 0 && blockedTasks.length === 0,
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
