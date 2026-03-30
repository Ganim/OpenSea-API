import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Survey } from '@/entities/hr/survey';
import type { SurveysRepository } from '@/repositories/hr/surveys-repository';

export interface UpdateSurveyRequest {
  tenantId: string;
  surveyId: string;
  title?: string;
  description?: string;
  type?: string;
  isAnonymous?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateSurveyResponse {
  survey: Survey;
}

export class UpdateSurveyUseCase {
  constructor(private surveysRepository: SurveysRepository) {}

  async execute(request: UpdateSurveyRequest): Promise<UpdateSurveyResponse> {
    const existingSurvey = await this.surveysRepository.findById(
      new UniqueEntityID(request.surveyId),
      request.tenantId,
    );

    if (!existingSurvey) {
      throw new Error('Survey not found');
    }

    if (!existingSurvey.isDraft()) {
      throw new Error('Only draft surveys can be updated');
    }

    const survey = await this.surveysRepository.update({
      id: new UniqueEntityID(request.surveyId),
      title: request.title,
      description: request.description,
      type: request.type,
      isAnonymous: request.isAnonymous,
      startDate: request.startDate,
      endDate: request.endDate,
    });

    return { survey: survey! };
  }
}
