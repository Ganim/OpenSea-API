import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneActionItem as PrismaOneOnOneActionItem } from '@prisma/generated/client.js';

export function mapOneOnOneActionItemPrismaToDomain(
  record: PrismaOneOnOneActionItem,
) {
  return {
    meetingId: new UniqueEntityID(record.meetingId),
    ownerId: new UniqueEntityID(record.ownerId),
    content: record.content,
    isCompleted: record.isCompleted,
    dueDate: record.dueDate ?? undefined,
    completedAt: record.completedAt ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
