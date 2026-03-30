import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Survey as PrismaSurvey } from '@prisma/generated/client.js';

export function mapSurveyPrismaToDomain(survey: PrismaSurvey) {
  return {
    tenantId: new UniqueEntityID(survey.tenantId),
    title: survey.title,
    description: survey.description ?? undefined,
    type: survey.type,
    status: survey.status,
    isAnonymous: survey.isAnonymous,
    startDate: survey.startDate,
    endDate: survey.endDate,
    createdBy: new UniqueEntityID(survey.createdBy),
    createdAt: survey.createdAt,
    updatedAt: survey.updatedAt,
  };
}
