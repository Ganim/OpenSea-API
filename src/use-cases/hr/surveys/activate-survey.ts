import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Survey } from '@/entities/hr/survey';
import type { SurveyQuestionsRepository } from '@/repositories/hr/survey-questions-repository';
import type { SurveysRepository } from '@/repositories/hr/surveys-repository';

export interface ActivateSurveyRequest {
  tenantId: string;
  surveyId: string;
}

export interface ActivateSurveyResponse {
  survey: Survey;
}

export class ActivateSurveyUseCase {
  constructor(
    private surveysRepository: SurveysRepository,
    private surveyQuestionsRepository: SurveyQuestionsRepository,
  ) {}

  async execute(
    request: ActivateSurveyRequest,
  ): Promise<ActivateSurveyResponse> {
    const surveyId = new UniqueEntityID(request.surveyId);

    const survey = await this.surveysRepository.findById(
      surveyId,
      request.tenantId,
    );

    if (!survey) {
      throw new Error('Survey not found');
    }

    if (!survey.isDraft()) {
      throw new Error('Only draft surveys can be activated');
    }

    const questions = await this.surveyQuestionsRepository.findBySurvey(
      surveyId,
      request.tenantId,
    );

    if (questions.length === 0) {
      throw new Error(
        'Survey must have at least one question before activation',
      );
    }

    const updatedSurvey = await this.surveysRepository.update({
      id: surveyId,
      status: 'ACTIVE',
    });

    return { survey: updatedSurvey! };
  }
}
