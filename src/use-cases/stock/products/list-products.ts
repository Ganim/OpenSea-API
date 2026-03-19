import type { Product } from '@/entities/stock/product';
import { ProductsRepository } from '@/repositories/stock/products-repository';

interface ListProductsUseCaseRequest {
  tenantId: string;
  search?: string;
  templateIds?: string[];
  manufacturerIds?: string[];
  categoryIds?: string[];
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface ListProductsUseCaseResponse {
  products: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListProductsUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute(
    request: ListProductsUseCaseRequest,
  ): Promise<ListProductsUseCaseResponse> {
    const {
      tenantId,
      search,
      templateIds,
      manufacturerIds,
      categoryIds,
      sortBy,
      sortOrder,
    } = request;
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const result = await this.productsRepository.findManyPaginated(tenantId, {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      templateIds,
      manufacturerIds,
      categoryIds,
    });

    return this.buildResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
      result.totalPages,
    );
  }

  private buildResponse(
    products: Product[],
    total: number,
    page: number,
    limit: number,
    pages: number,
  ): ListProductsUseCaseResponse {
    return {
      products,
      meta: { total, page, limit, pages },
    };
  }
}
