import { prisma } from '@/lib/db';
import { logActivity } from './activityService';

export async function startTaskTimer(taskId: string, teamMemberId?: string, note?: string) {
  // Check if there is already an active running timer on this task
  const existingRunning = await prisma.timeEntry.findFirst({
    where: { taskId, isRunning: true },
  });

  if (existingRunning) {
    return existingRunning;
  }

  const entry = await prisma.timeEntry.create({
    data: {
      taskId,
      teamMemberId: teamMemberId || null,
      startedAt: new Date(),
      isRunning: true,
      note,
    },
  });

  // Ensure task is IN_PROGRESS
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  await logActivity({
    entityType: 'TASK',
    entityId: taskId,
    action: 'TIMER_STARTED',
    newValue: new Date().toISOString(),
  });

  return entry;
}

export async function stopTaskTimer(timeEntryId: string) {
  const entry = await prisma.timeEntry.findUnique({
    where: { id: timeEntryId },
    include: { task: true },
  });

  if (!entry || !entry.isRunning) {
    return entry;
  }

  const now = new Date();
  const sessionDuration = Math.max(0, Math.floor((now.getTime() - entry.startedAt.getTime()) / 1000));

  const updatedEntry = await prisma.timeEntry.update({
    where: { id: timeEntryId },
    data: {
      isRunning: false,
      endedAt: now,
      durationSeconds: sessionDuration,
    },
  });

  // Increment total task time
  const updatedTask = await prisma.task.update({
    where: { id: entry.taskId },
    data: {
      totalTimeSeconds: {
        increment: sessionDuration,
      },
    },
  });

  await logActivity({
    entityType: 'TASK',
    entityId: entry.taskId,
    action: 'TIMER_STOPPED',
    newValue: `${Math.round(sessionDuration / 60)}m`,
    metadata: {
      sessionDurationSeconds: sessionDuration,
      totalTaskSeconds: updatedTask.totalTimeSeconds,
    },
  });

  return updatedEntry;
}

export async function getActiveTimers() {
  return await prisma.timeEntry.findMany({
    where: { isRunning: true },
    include: {
      task: {
        include: {
          client: true,
          assignee: true,
        },
      },
      teamMember: true,
    },
  });
}
