import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Application as PrismaApplication } from '@prisma/generated/client.js';

export function mapApplicationPrismaToDomain(application: PrismaApplication) {
  return {
    tenantId: new UniqueEntityID(application.tenantId),
    jobPostingId: new UniqueEntityID(application.jobPostingId),
    candidateId: new UniqueEntityID(application.candidateId),
    status: application.status,
    currentStageId: application.currentStageId
      ? new UniqueEntityID(application.currentStageId)
      : undefined,
    appliedAt: application.appliedAt,
    rejectedAt: application.rejectedAt ?? undefined,
    rejectionReason: application.rejectionReason ?? undefined,
    hiredAt: application.hiredAt ?? undefined,
    rating: application.rating ?? undefined,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}
