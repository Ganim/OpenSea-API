import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SurveysRepository } from '@/repositories/hr/surveys-repository';

export interface DeleteSurveyRequest {
  tenantId: string;
  surveyId: string;
}

export class DeleteSurveyUseCase {
  constructor(private surveysRepository: SurveysRepository) {}

  async execute(request: DeleteSurveyRequest): Promise<void> {
    const survey = await this.surveysRepository.findById(
      new UniqueEntityID(request.surveyId),
      request.tenantId,
    );

    if (!survey) {
      throw new Error('Survey not found');
    }

    if (survey.isActive()) {
      throw new Error('Cannot delete an active survey');
    }

    await this.surveysRepository.delete(new UniqueEntityID(request.surveyId));
  }
}
