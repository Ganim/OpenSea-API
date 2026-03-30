import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Objective as PrismaObjective } from '@prisma/generated/client.js';

export function mapObjectivePrismaToDomain(objective: PrismaObjective) {
  return {
    tenantId: new UniqueEntityID(objective.tenantId),
    title: objective.title,
    description: objective.description ?? undefined,
    ownerId: new UniqueEntityID(objective.ownerId),
    parentId: objective.parentId
      ? new UniqueEntityID(objective.parentId)
      : undefined,
    level: objective.level,
    status: objective.status,
    period: objective.period,
    startDate: objective.startDate,
    endDate: objective.endDate,
    progress: objective.progress,
    createdAt: objective.createdAt,
    updatedAt: objective.updatedAt,
  };
}
