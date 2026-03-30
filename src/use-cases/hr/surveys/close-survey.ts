import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Survey } from '@/entities/hr/survey';
import type { SurveysRepository } from '@/repositories/hr/surveys-repository';

export interface CloseSurveyRequest {
  tenantId: string;
  surveyId: string;
}

export interface CloseSurveyResponse {
  survey: Survey;
}

export class CloseSurveyUseCase {
  constructor(private surveysRepository: SurveysRepository) {}

  async execute(request: CloseSurveyRequest): Promise<CloseSurveyResponse> {
    const surveyId = new UniqueEntityID(request.surveyId);

    const survey = await this.surveysRepository.findById(
      surveyId,
      request.tenantId,
    );

    if (!survey) {
      throw new Error('Survey not found');
    }

    if (!survey.isActive()) {
      throw new Error('Only active surveys can be closed');
    }

    const updatedSurvey = await this.surveysRepository.update({
      id: surveyId,
      status: 'CLOSED',
    });

    return { survey: updatedSurvey! };
  }
}
