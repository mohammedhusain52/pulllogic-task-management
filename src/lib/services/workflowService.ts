import { prisma } from '@/lib/db';
import { logActivity } from './activityService';

export interface GenerateWorkflowRunParams {
  workflowTemplateId: string;
  period: string; // e.g., "October 2026"
  customAssigneeId?: string;
  name?: string;
}

export async function generateWorkflowRun(params: GenerateWorkflowRunParams) {
  const { workflowTemplateId, period, customAssigneeId, name } = params;

  // 1. Fetch template with stages and task templates
  const template = await prisma.workflowTemplate.findUnique({
    where: { id: workflowTemplateId },
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
    throw new Error('Workflow template not found');
  }

  // 2. Duplicate Prevention Check
  const existingRun = await prisma.workflowRun.findFirst({
    where: {
      workflowTemplateId: template.id,
      period: period.trim(),
    },
  });

  if (existingRun) {
    throw new Error(
      `A workflow run for "${template.name}" during "${period}" already exists.`
    );
  }

  const runName = name || `${template.client.name} ${template.name} — ${period}`;

  // 3. Transactional Generation
  const result = await prisma.$transaction(async (tx: any) => {
    // Create workflow run
    const firstStageName = template.stages[0]?.name || 'DEV';
    const workflowRun = await tx.workflowRun.create({
      data: {
        workflowTemplateId: template.id,
        clientId: template.clientId,
        name: runName,
        period: period.trim(),
        status: 'IN_PROGRESS',
        currentStage: firstStageName,
        startedAt: new Date(),
      },
    });

    const templateTaskToCreatedTaskMap: Record<string, string> = {};
    const createdTasks: { id: string }[] = [];

    // Create tasks for each stage
    for (const stage of template.stages) {
      let previousTaskIdInStage: string | null = null;

      for (const taskTpl of stage.taskTemplates) {
        // Resolve dependency: either from template dependency or sequential within stage
        let dependsOnTaskId: string | null = null;
        if (taskTpl.dependsOnTaskTemplateId && templateTaskToCreatedTaskMap[taskTpl.dependsOnTaskTemplateId]) {
          dependsOnTaskId = templateTaskToCreatedTaskMap[taskTpl.dependsOnTaskTemplateId];
        } else if (previousTaskIdInStage) {
          dependsOnTaskId = previousTaskIdInStage;
        }

        const createdTask: { id: string } = await tx.task.create({
          data: {
            workflowRunId: workflowRun.id,
            clientId: template.clientId,
            stageId: stage.id,
            title: taskTpl.name,
            description: taskTpl.description,
            type: 'WORKFLOW_STEP',
            status: 'NOT_STARTED',
            priority: 'HIGH',
            environment: stage.environment,
            sequence: taskTpl.sequence,
            assigneeId: customAssigneeId || taskTpl.defaultAssigneeId,
            dependsOnTaskId: dependsOnTaskId,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
          },
        });

        templateTaskToCreatedTaskMap[taskTpl.id] = createdTask.id;
        previousTaskIdInStage = createdTask.id;
        createdTasks.push({ id: createdTask.id });
      }
    }

    return { workflowRun, taskCount: createdTasks.length };
  });

  // Log activity
  await logActivity({
    entityType: 'WORKFLOW_RUN',
    entityId: result.workflowRun.id,
    action: 'CREATED',
    newValue: result.workflowRun.name,
    metadata: {
      template: template.name,
      client: template.client.name,
      period,
      tasksGenerated: result.taskCount,
    },
  });

  return result.workflowRun;
}

export async function getWorkflowRunDetails(runId: string) {
  const run = await prisma.workflowRun.findUnique({
    where: { id: runId },
    include: {
      client: true,
      workflowTemplate: {
        include: {
          stages: {
            orderBy: { sequence: 'asc' },
          },
        },
      },
      tasks: {
        orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }],
        include: {
          assignee: true,
          stage: true,
          dependsOnTask: true,
          timeEntries: true,
        },
      },
    },
  });

  if (!run) return null;

  // Calculate Stage Progression and Locking
  // Stages: DEV -> QA -> PROD
  const stages = run.workflowTemplate.stages;
  const stageStats = stages.map((stage, idx) => {
    const stageTasks = run.tasks.filter((t) => t.stageId === stage.id || t.environment === stage.environment);
    const totalTasks = stageTasks.length;
    const completedTasks = stageTasks.filter((t) => t.status === 'COMPLETED').length;
    const isStageComplete = totalTasks > 0 && completedTasks === totalTasks;

    // Previous stage must be complete to unlock
    let isLocked = false;
    let lockReason = '';

    if (idx > 0) {
      const prevStage = stages[idx - 1];
      const prevStageTasks = run.tasks.filter((t) => t.stageId === prevStage.id || t.environment === prevStage.environment);
      const prevComplete = prevStageTasks.length > 0 && prevStageTasks.every((t) => t.status === 'COMPLETED');
      if (!prevComplete) {
        isLocked = true;
        lockReason = `Waiting for ${prevStage.name} stage completion`;
      }
    }

    return {
      stageId: stage.id,
      name: stage.name,
      environment: stage.environment,
      sequence: stage.sequence,
      totalTasks,
      completedTasks,
      isComplete: isStageComplete,
      isLocked,
      lockReason,
      tasks: stageTasks,
    };
  });

  return {
    ...run,
    stageProgress: stageStats,
  };
}

export async function checkAndAdvanceWorkflowProgress(runId: string) {
  const run = await prisma.workflowRun.findUnique({
    where: { id: runId },
    include: {
      workflowTemplate: {
        include: {
          stages: {
            orderBy: { sequence: 'asc' },
          },
        },
      },
      tasks: true,
    },
  });

  if (!run) return;

  const stages = run.workflowTemplate.stages;
  let currentStageName = stages[0]?.name || 'DEV';
  let allStagesComplete = true;

  for (const stage of stages) {
    const stageTasks = run.tasks.filter((t) => t.stageId === stage.id || t.environment === stage.environment);
    const isStageComplete = stageTasks.length > 0 && stageTasks.every((t) => t.status === 'COMPLETED');

    if (!isStageComplete) {
      currentStageName = stage.name;
      allStagesComplete = false;
      break;
    }
  }

  if (allStagesComplete) {
    await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: 'COMPLETED',
        currentStage: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await logActivity({
      entityType: 'WORKFLOW_RUN',
      entityId: runId,
      action: 'COMPLETED',
      newValue: 'COMPLETED',
      metadata: { runName: run.name },
    });
  } else {
    await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        currentStage: currentStageName,
      },
    });
  }
}

export async function overrideTaskDependency(taskId: string, reason: string) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      isOverridden: true,
      overrideReason: reason,
      status: 'IN_PROGRESS',
    },
  });

  await logActivity({
    entityType: 'TASK',
    entityId: taskId,
    action: 'OVERRIDDEN',
    newValue: 'IN_PROGRESS',
    metadata: { reason },
  });

  return task;
}
