import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SurveyQuestion as PrismaSurveyQuestion } from '@prisma/generated/client.js';

export function mapSurveyQuestionPrismaToDomain(
  question: PrismaSurveyQuestion,
) {
  return {
    tenantId: new UniqueEntityID(question.tenantId),
    surveyId: new UniqueEntityID(question.surveyId),
    text: question.text,
    type: question.type,
    options: question.options ?? undefined,
    order: question.order,
    isRequired: question.isRequired,
    category: question.category,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
}
