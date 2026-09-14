import { prisma } from '@/lib/db';
import { logActivity } from './activityService';
import { checkAndAdvanceWorkflowProgress } from './workflowService';

export interface CreateTaskInput {
  title: string;
  description?: string;
  type?: 'TASK' | 'BUG' | 'ISSUE' | 'FEATURE' | 'WORKFLOW_STEP';
  status?: string;
  priority?: string;
  severity?: string;
  environment?: string;
  clientId?: string;
  assigneeId?: string;
  workflowRunId?: string;
  stageId?: string;
  parentTaskId?: string;
  dueDate?: Date | string | null;
  startDate?: Date | string | null;
  waitingForType?: string;
  waitingForId?: string;
  waitingForName?: string;
  waitingReason?: string;
  followUpDate?: Date | string | null;
  blockReason?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  targetRelease?: string;
  requirements?: string;
}

export async function createTask(input: CreateTaskInput) {
  const isWaiting = input.status === 'WAITING_FOR_UPDATE';
  const isBlocked = input.status === 'BLOCKED';

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type || 'TASK',
      status: input.status || 'NOT_STARTED',
      priority: input.priority || 'MEDIUM',
      severity: input.severity,
      environment: input.environment || 'DEV',
      clientId: input.clientId,
      assigneeId: input.assigneeId,
      workflowRunId: input.workflowRunId,
      stageId: input.stageId,
      parentTaskId: input.parentTaskId,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      waitingForType: isWaiting ? input.waitingForType : null,
      waitingForId: isWaiting ? input.waitingForId : null,
      waitingForName: isWaiting ? input.waitingForName : null,
      waitingSince: isWaiting ? new Date() : null,
      followUpDate: isWaiting && input.followUpDate ? new Date(input.followUpDate) : null,
      waitingReason: isWaiting ? input.waitingReason : null,
      blockReason: isBlocked ? input.blockReason : null,
      stepsToReproduce: input.stepsToReproduce,
      expectedBehavior: input.expectedBehavior,
      actualBehavior: input.actualBehavior,
      targetRelease: input.targetRelease,
      requirements: input.requirements,
      startedAt: input.status === 'IN_PROGRESS' ? new Date() : null,
    },
    include: {
      client: true,
      assignee: true,
      workflowRun: true,
    },
  });

  await logActivity({
    entityType: input.type || 'TASK',
    entityId: task.id,
    action: 'CREATED',
    newValue: task.title,
    metadata: {
      status: task.status,
      priority: task.priority,
      assignee: task.assignee?.name || 'Unassigned',
      client: task.client?.name || 'None',
    },
  });

  if (task.status === 'BLOCKED') {
    await prisma.notification.create({
      data: {
        type: 'TASK_BLOCKED',
        title: `🔴 ${task.type} Blocked: ${task.title}`,
        message: task.blockReason || 'Marked as blocked without reason.',
        entityType: task.type,
        entityId: task.id,
      },
    });
  }

  return task;
}

export async function updateTask(id: string, updates: Partial<CreateTaskInput> & { totalTimeSeconds?: number }) {
  const currentTask = await prisma.task.findUnique({
    where: { id },
    include: { assignee: true, client: true },
  });

  if (!currentTask) {
    throw new Error('Task not found');
  }

  const data: Record<string, unknown> = {};

  // Status transitions
  if (updates.status !== undefined && updates.status !== currentTask.status) {
    data.status = updates.status;

    if (updates.status === 'IN_PROGRESS' && !currentTask.startedAt) {
      data.startedAt = new Date();
    }

    if (updates.status === 'COMPLETED') {
      data.completedAt = new Date();
    }

    if (updates.status === 'WAITING_FOR_UPDATE') {
      data.waitingSince = new Date();
      data.waitingForType = updates.waitingForType ?? currentTask.waitingForType;
      data.waitingForId = updates.waitingForId ?? currentTask.waitingForId;
      data.waitingForName = updates.waitingForName ?? currentTask.waitingForName;
      data.waitingReason = updates.waitingReason ?? currentTask.waitingReason;
      data.followUpDate = updates.followUpDate ? new Date(updates.followUpDate) : currentTask.followUpDate;
    } else if (currentTask.status === 'WAITING_FOR_UPDATE' && updates.status !== 'WAITING_FOR_UPDATE') {
      // Clear waiting state
      data.waitingSince = null;
      data.waitingForType = null;
      data.waitingForId = null;
      data.waitingForName = null;
      data.waitingReason = null;
      data.followUpDate = null;
    }

    if (updates.status === 'BLOCKED') {
      data.blockReason = updates.blockReason ?? currentTask.blockReason;
      await prisma.notification.create({
        data: {
          type: 'TASK_BLOCKED',
          title: `🔴 ${currentTask.type} Blocked: ${currentTask.title}`,
          message: updates.blockReason || 'Marked as blocked.',
          entityType: currentTask.type,
          entityId: currentTask.id,
        },
      });
    }

    await logActivity({
      entityType: currentTask.type,
      entityId: id,
      action: 'STATUS_CHANGED',
      oldValue: currentTask.status,
      newValue: updates.status,
      metadata: {
        reason: updates.waitingReason || updates.blockReason,
        waitingFor: updates.waitingForName,
      },
    });
  }

  // Assignee change
  if (updates.assigneeId !== undefined && updates.assigneeId !== currentTask.assigneeId) {
    data.assigneeId = updates.assigneeId;
    let newAssigneeName = 'Unassigned';
    if (updates.assigneeId) {
      const member = await prisma.teamMember.findUnique({ where: { id: updates.assigneeId } });
      newAssigneeName = member?.name || 'Unknown';
    }
    await logActivity({
      entityType: currentTask.type,
      entityId: id,
      action: 'ASSIGNED',
      oldValue: currentTask.assignee?.name || 'Unassigned',
      newValue: newAssigneeName,
    });
  }

  // Priority change
  if (updates.priority !== undefined && updates.priority !== currentTask.priority) {
    data.priority = updates.priority;
    await logActivity({
      entityType: currentTask.type,
      entityId: id,
      action: 'PRIORITY_CHANGED',
      oldValue: currentTask.priority,
      newValue: updates.priority,
    });
  }

  if (updates.title !== undefined) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.environment !== undefined) data.environment = updates.environment;
  if (updates.clientId !== undefined) data.clientId = updates.clientId;
  if (updates.severity !== undefined) data.severity = updates.severity;
  if (updates.dueDate !== undefined) data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
  if (updates.startDate !== undefined) data.startDate = updates.startDate ? new Date(updates.startDate) : null;
  if (updates.stepsToReproduce !== undefined) data.stepsToReproduce = updates.stepsToReproduce;
  if (updates.expectedBehavior !== undefined) data.expectedBehavior = updates.expectedBehavior;
  if (updates.actualBehavior !== undefined) data.actualBehavior = updates.actualBehavior;
  if (updates.targetRelease !== undefined) data.targetRelease = updates.targetRelease;
  if (updates.requirements !== undefined) data.requirements = updates.requirements;
  if (updates.totalTimeSeconds !== undefined) data.totalTimeSeconds = updates.totalTimeSeconds;
  if (updates.waitingForType !== undefined) data.waitingForType = updates.waitingForType;
  if (updates.waitingForName !== undefined) data.waitingForName = updates.waitingForName;
  if (updates.waitingReason !== undefined) data.waitingReason = updates.waitingReason;
  if (updates.followUpDate !== undefined) data.followUpDate = updates.followUpDate ? new Date(updates.followUpDate) : null;
  if (updates.blockReason !== undefined) data.blockReason = updates.blockReason;

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: {
      client: true,
      assignee: true,
      workflowRun: true,
      subTasks: true,
      timeEntries: true,
    },
  });

  // If task belongs to a workflow run and status changed, check stage progression
  if (currentTask.workflowRunId && updates.status !== undefined) {
    await checkAndAdvanceWorkflowProgress(currentTask.workflowRunId);
  }

  return updated;
}

export async function getTaskDetails(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      client: true,
      assignee: true,
      stage: true,
      workflowRun: {
        include: {
          workflowTemplate: true,
        },
      },
      subTasks: {
        include: { assignee: true },
        orderBy: { sequence: 'asc' },
      },
      timeEntries: {
        include: { teamMember: true },
        orderBy: { startedAt: 'desc' },
      },
    },
  });

  if (!task) return null;

  const comments = await prisma.comment.findMany({
    where: { entityType: task.type, entityId: id },
    orderBy: { createdAt: 'desc' },
  });

  const attachments = await prisma.attachment.findMany({
    where: { entityType: task.type, entityId: id },
    orderBy: { createdAt: 'desc' },
  });

  const activityHistory = await prisma.activityLog.findMany({
    where: { entityType: task.type, entityId: id },
    orderBy: { createdAt: 'desc' },
  });

  return {
    ...task,
    comments,
    attachments,
    activityHistory,
  };
}
