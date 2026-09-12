import { prisma } from '@/lib/db';

export async function getNotifications(onlyUnread = false, limit = 20) {
  return await prisma.notification.findMany({
    where: onlyUnread ? { read: false } : {},
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function markNotificationAsRead(id: string) {
  return await prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

export async function markAllNotificationsAsRead() {
  return await prisma.notification.updateMany({
    where: { read: false },
    data: { read: true },
  });
}

export async function syncAutomatedNotifications() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Scan for waiting tasks needing follow-up
  const waitingTasks = await prisma.task.findMany({
    where: {
      status: 'WAITING_FOR_UPDATE',
      OR: [
        { waitingSince: { lte: yesterday } },
        { followUpDate: { lte: now } },
      ],
    },
    include: { client: true },
  });

  for (const task of waitingTasks) {
    const existing = await prisma.notification.findFirst({
      where: {
        entityId: task.id,
        type: 'FOLLOW_UP_REQUIRED',
        read: false,
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          type: 'FOLLOW_UP_REQUIRED',
          title: `🔴 ${task.client?.name || ''} ${task.title} requires follow-up`,
          message: `Waiting for ${task.waitingForName || 'update'} since ${
            task.waitingSince ? new Date(task.waitingSince).toLocaleDateString() : 'yesterday'
          }.`,
          entityType: task.type,
          entityId: task.id,
        },
      });
    }
  }

  // 2. Scan for overdue tasks
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
      dueDate: { lt: now },
    },
    include: { client: true },
  });

  for (const task of overdueTasks) {
    const existing = await prisma.notification.findFirst({
      where: {
        entityId: task.id,
        type: 'TASK_OVERDUE',
        read: false,
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          type: 'TASK_OVERDUE',
          title: `⚠️ Overdue Task: ${task.title}`,
          message: `Due date was ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'in the past'}.`,
          entityType: task.type,
          entityId: task.id,
        },
      });
    }
  }
}
