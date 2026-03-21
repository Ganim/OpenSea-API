import type { Catalog } from '@/entities/sales/catalog';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { CatalogsRepository } from '@/repositories/sales/catalogs-repository';

interface ListCatalogsUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  isPublic?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListCatalogsUseCaseResponse {
  catalogs: PaginatedResult<Catalog>;
}

export class ListCatalogsUseCase {
  constructor(private catalogsRepository: CatalogsRepository) {}

  async execute(
    request: ListCatalogsUseCaseRequest,
  ): Promise<ListCatalogsUseCaseResponse> {
    const catalogs = await this.catalogsRepository.findManyPaginated({
      tenantId: request.tenantId,
      page: request.page ?? 1,
      limit: Math.min(request.limit ?? 20, 100),
      search: request.search,
      status: request.status,
      type: request.type,
      isPublic: request.isPublic,
      sortBy: request.sortBy,
      sortOrder: request.sortOrder,
    });

    return { catalogs };
  }
}
