import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PerformanceReview as PrismaPerformanceReview } from '@prisma/generated/client.js';

export function mapPerformanceReviewPrismaToDomain(
  review: PrismaPerformanceReview,
) {
  return {
    tenantId: new UniqueEntityID(review.tenantId),
    reviewCycleId: new UniqueEntityID(review.reviewCycleId),
    employeeId: new UniqueEntityID(review.employeeId),
    reviewerId: new UniqueEntityID(review.reviewerId),
    status: review.status,
    selfScore: review.selfScore ?? undefined,
    managerScore: review.managerScore ?? undefined,
    finalScore: review.finalScore ?? undefined,
    selfComments: review.selfComments ?? undefined,
    managerComments: review.managerComments ?? undefined,
    strengths: review.strengths ?? undefined,
    improvements: review.improvements ?? undefined,
    goals: review.goals ?? undefined,
    employeeAcknowledged: review.employeeAcknowledged,
    acknowledgedAt: review.acknowledgedAt ?? undefined,
    completedAt: review.completedAt ?? undefined,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}
