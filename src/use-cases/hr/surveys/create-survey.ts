import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Survey } from '@/entities/hr/survey';
import type { SurveysRepository } from '@/repositories/hr/surveys-repository';

export interface CreateSurveyRequest {
  tenantId: string;
  title: string;
  description?: string;
  type: string;
  isAnonymous?: boolean;
  startDate: Date;
  endDate: Date;
  createdBy: string;
}

export interface CreateSurveyResponse {
  survey: Survey;
}

export class CreateSurveyUseCase {
  constructor(private surveysRepository: SurveysRepository) {}

  async execute(request: CreateSurveyRequest): Promise<CreateSurveyResponse> {
    if (request.endDate <= request.startDate) {
      throw new Error('End date must be after start date');
    }

    const survey = await this.surveysRepository.create({
      tenantId: request.tenantId,
      title: request.title,
      description: request.description,
      type: request.type,
      isAnonymous: request.isAnonymous,
      startDate: request.startDate,
      endDate: request.endDate,
      createdBy: new UniqueEntityID(request.createdBy),
    });

    return { survey };
  }
}
