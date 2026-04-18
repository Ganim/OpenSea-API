import { prisma } from '@/lib/prisma.js';
import type {
  Prisma,
  Notification as PrismaNotification,
} from '../../../../../prisma/generated/prisma/client.js';

export type NotificationCreateInput = Prisma.NotificationUncheckedCreateInput;
export type NotificationRecord = PrismaNotification;

export class NotificationPrismaRepository {
  async create(data: NotificationCreateInput): Promise<NotificationRecord> {
    return prisma.notification.create({ data });
  }

  async findByIdempotency(
    tenantId: string,
    userId: string,
    idempotencyKey: string,
  ): Promise<NotificationRecord | null> {
    return prisma.notification.findFirst({
      where: { tenantId, userId, idempotencyKey, deletedAt: null },
    });
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    return prisma.notification.findUnique({ where: { id } });
  }

  async findGroupedRecent(params: {
    tenantId: string;
    userId: string;
    groupKey: string;
    windowMs: number;
  }): Promise<NotificationRecord | null> {
    const { tenantId, userId, groupKey, windowMs } = params;
    const cutoff = new Date(Date.now() - windowMs);
    return prisma.notification.findFirst({
      where: {
        tenantId,
        userId,
        groupKey,
        isRead: false,
        deletedAt: null,
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementGrouped(
    id: string,
    metadata: Record<string, unknown>,
  ): Promise<NotificationRecord> {
    return prisma.notification.update({
      where: { id },
      data: {
        metadata: metadata as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
  }

  async resolve(params: {
    id: string;
    action: string;
    resolvedById: string;
    payload?: Record<string, unknown>;
    newState: 'RESOLVED' | 'DECLINED';
  }): Promise<NotificationRecord> {
    const { id, action, resolvedById, payload, newState } = params;
    return prisma.notification.update({
      where: { id },
      data: {
        state: newState,
        resolvedAction: action,
        resolvedById,
        resolvedAt: new Date(),
        resolvedPayload: payload as Prisma.InputJsonValue | undefined,
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markCancelled(id: string): Promise<NotificationRecord> {
    return prisma.notification.update({
      where: { id },
      data: { state: 'CANCELLED', updatedAt: new Date() },
    });
  }

  async updateProgress(params: {
    id: string;
    progress: number;
    total?: number;
    completed?: boolean;
  }): Promise<NotificationRecord> {
    const { id, progress, total, completed } = params;
    return prisma.notification.update({
      where: { id },
      data: {
        progress,
        progressTotal: total,
        state: completed ? 'RESOLVED' : 'PENDING',
        resolvedAt: completed ? new Date() : undefined,
      },
    });
  }
}
