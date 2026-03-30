import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Survey } from '@/entities/hr/survey';
import type { SurveysRepository } from '@/repositories/hr/surveys-repository';

export interface ListSurveysRequest {
  tenantId: string;
  type?: string;
  status?: string;
  createdBy?: string;
  page?: number;
  perPage?: number;
}

export interface ListSurveysResponse {
  surveys: Survey[];
  total: number;
}

export class ListSurveysUseCase {
  constructor(private surveysRepository: SurveysRepository) {}

  async execute(request: ListSurveysRequest): Promise<ListSurveysResponse> {
    const { tenantId, type, status, createdBy, page, perPage } = request;

    const { surveys, total } = await this.surveysRepository.findMany(tenantId, {
      type,
      status,
      createdBy: createdBy ? new UniqueEntityID(createdBy) : undefined,
      page,
      perPage,
    });

    return { surveys, total };
  }
}
