import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SurveyAnswer } from '@/entities/hr/survey-answer';

export interface CreateSurveyAnswerSchema {
  tenantId: string;
  surveyResponseId: UniqueEntityID;
  questionId: UniqueEntityID;
  ratingValue?: number;
  textValue?: string;
  selectedOptions?: unknown;
}

export interface SurveyAnswersRepository {
  create(data: CreateSurveyAnswerSchema): Promise<SurveyAnswer>;
  bulkCreate(answers: CreateSurveyAnswerSchema[]): Promise<SurveyAnswer[]>;
  findByResponse(
    surveyResponseId: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyAnswer[]>;
  findByQuestion(
    questionId: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyAnswer[]>;
}
