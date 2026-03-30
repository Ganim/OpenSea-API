import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReviewCycle as PrismaReviewCycle } from '@prisma/generated/client.js';

export function mapReviewCyclePrismaToDomain(cycle: PrismaReviewCycle) {
  return {
    tenantId: new UniqueEntityID(cycle.tenantId),
    name: cycle.name,
    description: cycle.description ?? undefined,
    type: cycle.type,
    startDate: cycle.startDate,
    endDate: cycle.endDate,
    status: cycle.status,
    isActive: cycle.isActive,
    createdAt: cycle.createdAt,
    updatedAt: cycle.updatedAt,
    deletedAt: cycle.deletedAt ?? undefined,
  };
}
