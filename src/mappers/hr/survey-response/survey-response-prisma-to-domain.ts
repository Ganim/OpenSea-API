import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SurveyResponse as PrismaSurveyResponse } from '@prisma/generated/client.js';

export function mapSurveyResponsePrismaToDomain(
  response: PrismaSurveyResponse,
) {
  return {
    tenantId: new UniqueEntityID(response.tenantId),
    surveyId: new UniqueEntityID(response.surveyId),
    employeeId: response.employeeId
      ? new UniqueEntityID(response.employeeId)
      : undefined,
    submittedAt: response.submittedAt,
    createdAt: response.createdAt,
  };
}
