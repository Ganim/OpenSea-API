import type { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import type { ProcessBlueprintsRepository } from '@/repositories/sales/process-blueprints-repository';

interface ListBlueprintsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  pipelineId?: string;
  search?: string;
}

interface ListBlueprintsUseCaseResponse {
  blueprints: ProcessBlueprint[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListBlueprintsUseCase {
  constructor(private blueprintsRepository: ProcessBlueprintsRepository) {}

  async execute(
    request: ListBlueprintsUseCaseRequest,
  ): Promise<ListBlueprintsUseCaseResponse> {
    const result = await this.blueprintsRepository.findManyPaginated({
      tenantId: request.tenantId,
      page: request.page,
      limit: request.limit,
      pipelineId: request.pipelineId,
      search: request.search,
    });

    return {
      blueprints: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
