import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Survey } from '@/entities/hr/survey';
import type { SurveysRepository } from '@/repositories/hr/surveys-repository';

export interface GetSurveyRequest {
  tenantId: string;
  surveyId: string;
}

export interface GetSurveyResponse {
  survey: Survey;
}

export class GetSurveyUseCase {
  constructor(private surveysRepository: SurveysRepository) {}

  async execute(request: GetSurveyRequest): Promise<GetSurveyResponse> {
    const survey = await this.surveysRepository.findById(
      new UniqueEntityID(request.surveyId),
      request.tenantId,
    );

    if (!survey) {
      throw new Error('Survey not found');
    }

    return { survey };
  }
}
