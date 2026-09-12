import { prisma } from '@/lib/db';

export interface LogActivityParams {
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        oldValue: params.oldValue,
        newValue: params.newValue,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    return null;
  }
}

export async function getActivityHistory(entityType?: string, entityId?: string, limit = 50) {
  const where: { entityType?: string; entityId?: string } = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  return await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
