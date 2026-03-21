import type { GeneratedContent } from '@/entities/sales/generated-content';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { GeneratedContentsRepository } from '@/repositories/sales/generated-contents-repository';

interface ListGeneratedContentsUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  productId?: string;
  catalogId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListGeneratedContentsUseCaseResponse {
  contents: PaginatedResult<GeneratedContent>;
}

export class ListGeneratedContentsUseCase {
  constructor(
    private generatedContentsRepository: GeneratedContentsRepository,
  ) {}

  async execute(
    request: ListGeneratedContentsUseCaseRequest,
  ): Promise<ListGeneratedContentsUseCaseResponse> {
    const contents =
      await this.generatedContentsRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: request.page ?? 1,
        limit: Math.min(request.limit ?? 20, 100),
        search: request.search,
        type: request.type,
        status: request.status,
        productId: request.productId,
        catalogId: request.catalogId,
        sortBy: request.sortBy,
        sortOrder: request.sortOrder,
      });

    return { contents };
  }
}
