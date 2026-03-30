import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Objective } from '@/entities/hr/objective';
import type { ObjectivesRepository } from '@/repositories/hr/objectives-repository';

export interface ListObjectivesRequest {
  tenantId: string;
  ownerId?: string;
  parentId?: string;
  level?: string;
  status?: string;
  period?: string;
  page?: number;
  perPage?: number;
}

export interface ListObjectivesResponse {
  objectives: Objective[];
  total: number;
}

export class ListObjectivesUseCase {
  constructor(private objectivesRepository: ObjectivesRepository) {}

  async execute(
    request: ListObjectivesRequest,
  ): Promise<ListObjectivesResponse> {
    const { objectives, total } = await this.objectivesRepository.findMany(
      request.tenantId,
      {
        ownerId: request.ownerId
          ? new UniqueEntityID(request.ownerId)
          : undefined,
        parentId: request.parentId
          ? new UniqueEntityID(request.parentId)
          : undefined,
        level: request.level,
        status: request.status,
        period: request.period,
        page: request.page,
        perPage: request.perPage,
      },
    );

    return { objectives, total };
  }
}
