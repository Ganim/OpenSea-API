import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SurveyAnswer as PrismaSurveyAnswer } from '@prisma/generated/client.js';

export function mapSurveyAnswerPrismaToDomain(answer: PrismaSurveyAnswer) {
  return {
    tenantId: new UniqueEntityID(answer.tenantId),
    surveyResponseId: new UniqueEntityID(answer.surveyResponseId),
    questionId: new UniqueEntityID(answer.questionId),
    ratingValue: answer.ratingValue ?? undefined,
    textValue: answer.textValue ?? undefined,
    selectedOptions: answer.selectedOptions ?? undefined,
    createdAt: answer.createdAt,
  };
}
