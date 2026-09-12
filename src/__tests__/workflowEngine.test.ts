import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { generateWorkflowRun, getWorkflowRunDetails, overrideTaskDependency } from '@/lib/services/workflowService';
import { createTask, updateTask, getTaskDetails } from '@/lib/services/taskService';
import { startTaskTimer, stopTaskTimer } from '@/lib/services/timeTrackingService';

describe('Pull Logic Workflow Engine & Domain Services', () => {
  let testClient: { id: string; name: string };
  let testTemplate: { id: string; name: string };
  let devStage: { id: string; name: string };
  let qaStage: { id: string; name: string };
  let prodStage: { id: string; name: string };

  beforeEach(async () => {
    // Setup clean isolated test client & template
    testClient = await prisma.client.upsert({
      where: { name: 'TestClient-Yanmar' },
      update: {},
      create: {
        name: 'TestClient-Yanmar',
        description: 'Test Industrial equipment client',
      },
    });

    testTemplate = await prisma.workflowTemplate.create({
      data: {
        clientId: testClient.id,
        name: `Sales-${Date.now()}`,
        recurrence: 'MONTHLY',
      },
    });

    devStage = await prisma.workflowStage.create({
      data: {
        workflowTemplateId: testTemplate.id,
        name: 'DEV',
        environment: 'DEV',
        sequence: 1,
      },
    });

    qaStage = await prisma.workflowStage.create({
      data: {
        workflowTemplateId: testTemplate.id,
        name: 'QA',
        environment: 'QA',
        sequence: 2,
      },
    });

    prodStage = await prisma.workflowStage.create({
      data: {
        workflowTemplateId: testTemplate.id,
        name: 'PROD',
        environment: 'PROD',
        sequence: 3,
      },
    });

    // Create 2 task templates in DEV
    const t1 = await prisma.taskTemplate.create({
      data: {
        workflowStageId: devStage.id,
        name: 'Receive Sales File',
        sequence: 1,
      },
    });

    await prisma.taskTemplate.create({
      data: {
        workflowStageId: devStage.id,
        name: 'DEV Testing',
        sequence: 2,
        dependsOnTaskTemplateId: t1.id,
      },
    });

    // Create 1 task template in QA
    await prisma.taskTemplate.create({
      data: {
        workflowStageId: qaStage.id,
        name: 'QA Validation',
        sequence: 1,
      },
    });

    // Create 1 task template in PROD
    await prisma.taskTemplate.create({
      data: {
        workflowStageId: prodStage.id,
        name: 'PROD Final Confirmation',
        sequence: 1,
      },
    });
  });

  it('1. Generates workflow run transactionally with all stage tasks and dependencies', async () => {
    const period = `October-${Date.now()}`;
    const run = await generateWorkflowRun({
      workflowTemplateId: testTemplate.id,
      period,
    });

    expect(run).toBeDefined();
    expect(run.period).toBe(period);
    expect(run.status).toBe('IN_PROGRESS');

    const details = await getWorkflowRunDetails(run.id);
    expect(details).not.toBeNull();
    expect(details?.tasks.length).toBe(4); // 2 in DEV, 1 in QA, 1 in PROD
    expect(details?.stageProgress.length).toBe(3);
  });

  it('2. Prevents duplicate workflow runs for identical period', async () => {
    const period = `November-${Date.now()}`;
    await generateWorkflowRun({
      workflowTemplateId: testTemplate.id,
      period,
    });

    // Attempting duplicate should throw
    await expect(
      generateWorkflowRun({
        workflowTemplateId: testTemplate.id,
        period,
      })
    ).rejects.toThrow(/already exists/i);
  });

  it('3. Enforces DEV → QA → PROD stage dependency locking', async () => {
    const period = `December-${Date.now()}`;
    const run = await generateWorkflowRun({
      workflowTemplateId: testTemplate.id,
      period,
    });

    let details = await getWorkflowRunDetails(run.id);
    expect(details).not.toBeNull();

    // DEV stage should not be locked
    const devStatus = details!.stageProgress.find((s) => s.name === 'DEV');
    expect(devStatus?.isLocked).toBe(false);

    // QA stage MUST be locked because DEV tasks are NOT completed
    const qaStatus = details!.stageProgress.find((s) => s.name === 'QA');
    expect(qaStatus?.isLocked).toBe(true);
    expect(qaStatus?.lockReason).toContain('DEV');

    // Complete all DEV tasks
    const devTasks = details!.tasks.filter((t) => t.stageId === devStage.id);
    for (const task of devTasks) {
      await updateTask(task.id, { status: 'COMPLETED' });
    }

    // Recheck details: QA stage should now be UNLOCKED
    details = await getWorkflowRunDetails(run.id);
    const updatedQaStatus = details!.stageProgress.find((s) => s.name === 'QA');
    expect(updatedQaStatus?.isLocked).toBe(false);
  });

  it('4. Captures waiting state, waitingSince, and follow-up deadline', async () => {
    const task = await createTask({
      title: 'Yanmar Model Validation',
      type: 'TASK',
      status: 'WAITING_FOR_UPDATE',
      waitingForType: 'TESTING_TEAM',
      waitingForName: 'Testing Team',
      waitingReason: 'Awaiting forecast accuracy report',
      followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    expect(task.status).toBe('WAITING_FOR_UPDATE');
    expect(task.waitingForName).toBe('Testing Team');
    expect(task.waitingSince).toBeInstanceOf(Date);
    expect(task.waitingReason).toBe('Awaiting forecast accuracy report');
  });

  it('5. Live time tracking accurately aggregates duration and updates task total time', async () => {
    const task = await createTask({
      title: 'Feature Preprocessing Task',
      type: 'TASK',
    });

    const timer = await startTaskTimer(task.id);
    expect(timer.isRunning).toBe(true);

    // Stop timer
    const stopped = await stopTaskTimer(timer.id);
    expect(stopped?.isRunning).toBe(false);

    const taskDetails = await getTaskDetails(task.id);
    expect(taskDetails?.timeEntries.length).toBe(1);
    expect(taskDetails?.totalTimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('6. Manual override unblocks task and records audit history', async () => {
    const task = await createTask({
      title: 'Blocked Ingestion Job',
      type: 'TASK',
      status: 'BLOCKED',
      blockReason: 'Missing S3 bucket permission',
    });

    const overridden = await overrideTaskDependency(task.id, 'Permission granted by admin Mohammed');
    expect(overridden.isOverridden).toBe(true);
    expect(overridden.overrideReason).toBe('Permission granted by admin Mohammed');
    expect(overridden.status).toBe('IN_PROGRESS');

    const details = await getTaskDetails(task.id);
    const overrideLog = details?.activityHistory.find((a) => a.action === 'OVERRIDDEN');
    expect(overrideLog).toBeDefined();
  });
});
