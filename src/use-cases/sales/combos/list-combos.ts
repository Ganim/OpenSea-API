import type { Combo, ComboType } from '@/entities/sales/combo';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { CombosRepository } from '@/repositories/sales/combos-repository';

interface ListCombosUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  type?: ComboType;
}

interface ListCombosUseCaseResponse {
  combos: PaginatedResult<Combo>;
}

export class ListCombosUseCase {
  constructor(private combosRepository: CombosRepository) {}

  async execute(
    request: ListCombosUseCaseRequest,
  ): Promise<ListCombosUseCaseResponse> {
    const combos = await this.combosRepository.findManyPaginated({
      tenantId: request.tenantId,
      page: request.page,
      limit: request.limit,
      search: request.search,
      isActive: request.isActive,
      type: request.type,
    });

    return { combos };
  }
}
