import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InterviewStage as PrismaInterviewStage } from '@prisma/generated/client.js';

export function mapInterviewStagePrismaToDomain(stage: PrismaInterviewStage) {
  return {
    tenantId: new UniqueEntityID(stage.tenantId),
    jobPostingId: new UniqueEntityID(stage.jobPostingId),
    name: stage.name,
    order: stage.order,
    type: stage.type,
    description: stage.description ?? undefined,
    createdAt: stage.createdAt,
    updatedAt: stage.updatedAt,
  };
}
