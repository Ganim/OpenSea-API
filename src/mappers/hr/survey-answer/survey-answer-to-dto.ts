import type { SurveyAnswer } from '@/entities/hr/survey-answer';

export interface SurveyAnswerDTO {
  id: string;
  surveyResponseId: string;
  questionId: string;
  ratingValue: number | null;
  textValue: string | null;
  selectedOptions: unknown | null;
  createdAt: string;
}

export function surveyAnswerToDTO(answer: SurveyAnswer): SurveyAnswerDTO {
  return {
    id: answer.id.toString(),
    surveyResponseId: answer.surveyResponseId.toString(),
    questionId: answer.questionId.toString(),
    ratingValue: answer.ratingValue ?? null,
    textValue: answer.textValue ?? null,
    selectedOptions: answer.selectedOptions ?? null,
    createdAt: answer.createdAt.toISOString(),
  };
}
