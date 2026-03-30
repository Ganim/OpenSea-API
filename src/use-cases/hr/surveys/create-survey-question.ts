import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SurveyQuestion } from '@/entities/hr/survey-question';
import type { SurveyQuestionsRepository } from '@/repositories/hr/survey-questions-repository';
import type { SurveysRepository } from '@/repositories/hr/surveys-repository';

export interface CreateSurveyQuestionRequest {
  tenantId: string;
  surveyId: string;
  text: string;
  type: string;
  options?: unknown;
  order: number;
  isRequired?: boolean;
  category: string;
}

export interface CreateSurveyQuestionResponse {
  question: SurveyQuestion;
}

export class CreateSurveyQuestionUseCase {
  constructor(
    private surveysRepository: SurveysRepository,
    private surveyQuestionsRepository: SurveyQuestionsRepository,
  ) {}

  async execute(
    request: CreateSurveyQuestionRequest,
  ): Promise<CreateSurveyQuestionResponse> {
    const surveyId = new UniqueEntityID(request.surveyId);

    const survey = await this.surveysRepository.findById(
      surveyId,
      request.tenantId,
    );

    if (!survey) {
      throw new Error('Survey not found');
    }

    if (!survey.isDraft()) {
      throw new Error('Questions can only be added to draft surveys');
    }

    const question = await this.surveyQuestionsRepository.create({
      tenantId: request.tenantId,
      surveyId,
      text: request.text,
      type: request.type,
      options: request.options,
      order: request.order,
      isRequired: request.isRequired,
      category: request.category,
    });

    return { question };
  }
}
