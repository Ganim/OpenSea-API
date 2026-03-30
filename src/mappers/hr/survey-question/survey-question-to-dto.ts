import type { SurveyQuestion } from '@/entities/hr/survey-question';

export interface SurveyQuestionDTO {
  id: string;
  surveyId: string;
  text: string;
  type: string;
  options: unknown | null;
  order: number;
  isRequired: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export function surveyQuestionToDTO(
  question: SurveyQuestion,
): SurveyQuestionDTO {
  return {
    id: question.id.toString(),
    surveyId: question.surveyId.toString(),
    text: question.text,
    type: question.type,
    options: question.options ?? null,
    order: question.order,
    isRequired: question.isRequired,
    category: question.category,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  };
}
