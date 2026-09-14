import { prisma } from '@/lib/db';
import { sortByPriority } from '@/lib/utils';

export async function getFollowUpsRequired() {
  const thresholdSetting = await prisma.systemSetting.findUnique({
    where: { key: 'follow_up_threshold_days' },
  });
  const thresholdDays = parseInt(thresholdSetting?.value || '1', 10);
  const cutoffDate = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);

  // Follow-ups include:
  // 1. All tasks with status 'BLOCKED' (unblock action required)
  // 2. Tasks with priority 'CRITICAL' (requiring urgent follow-up / attention)
  // 3. Tasks in 'WAITING_FOR_UPDATE'
  // 4. Tasks with followUpDate <= now
  const followUpTasks = await prisma.task.findMany({
    where: {
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
      OR: [
        { status: 'BLOCKED' },
        { priority: 'CRITICAL' },
        { status: 'WAITING_FOR_UPDATE' },
        { followUpDate: { lte: new Date() } },
        {
          status: 'WAITING_FOR_UPDATE',
          waitingSince: { lte: cutoffDate },
        },
      ],
    },
    include: {
      client: true,
      assignee: true,
      workflowRun: true,
      stage: true,
    },
  });

  return sortByPriority(followUpTasks);
}

export async function getDashboardMetrics() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Active tasks (NOT completed or cancelled)
  const activeCount = await prisma.task.count({
    where: {
      status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'WAITING_FOR_UPDATE', 'BLOCKED'] },
    },
  });

  // Due today
  const dueTodayCount = await prisma.task.count({
    where: {
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
      dueDate: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
  });

  // Follow-ups
  const followUps = await getFollowUpsRequired();
  const followUpCount = followUps.length;

  // Blocked
  const blockedCount = await prisma.task.count({
    where: {
      status: 'BLOCKED',
    },
  });

  // Overdue
  const overdueCount = await prisma.task.count({
    where: {
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
      dueDate: {
        lt: startOfToday,
      },
    },
  });

  // Team Active (team members with at least one IN_PROGRESS task or running timer)
  const activeTeamMembers = await prisma.teamMember.findMany({
    where: {
      active: true,
      tasks: {
        some: {
          status: 'IN_PROGRESS',
        },
      },
    },
  });

  return {
    active: activeCount,
    dueToday: dueTodayCount,
    followUps: followUpCount,
    blocked: blockedCount,
    teamActive: activeTeamMembers.length,
    overdue: overdueCount,
  };
}
