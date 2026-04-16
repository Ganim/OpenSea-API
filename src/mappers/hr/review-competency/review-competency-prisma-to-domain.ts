import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReviewCompetency as PrismaReviewCompetency } from '@prisma/generated/client.js';

export function mapReviewCompetencyPrismaToDomain(
  competency: PrismaReviewCompetency,
) {
  return {
    tenantId: new UniqueEntityID(competency.tenantId),
    reviewId: new UniqueEntityID(competency.reviewId),
    name: competency.name,
    selfScore: competency.selfScore ?? undefined,
    managerScore: competency.managerScore ?? undefined,
    weight: competency.weight,
    comments: competency.comments ?? undefined,
    createdAt: competency.createdAt,
    updatedAt: competency.updatedAt,
    deletedAt: competency.deletedAt ?? undefined,
  };
}
