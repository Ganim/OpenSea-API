import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Product } from '@/entities/stock/product';
import { ProductsRepository } from '@/repositories/stock/products-repository';

interface ListProductsUseCaseRequest {
  tenantId: string;
  search?: string;
  templateId?: string;
  manufacturerId?: string;
  categoryId?: string;
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
    const { tenantId, search, templateId, manufacturerId, categoryId } =
      request;
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    // When multiple filters are active, we need post-filtering which requires in-memory pagination
    const hasMultipleFilters =
      [templateId, manufacturerId, categoryId].filter(Boolean).length > 1;

    if (hasMultipleFilters) {
      // Fetch with primary filter, then post-filter, then paginate in-memory
      let products: Product[];

      if (templateId) {
        products = await this.productsRepository.findManyByTemplate(
          new UniqueEntityID(templateId),
          tenantId,
        );
        if (manufacturerId) {
          products = products.filter(
            (p) => p.manufacturerId?.toString() === manufacturerId,
          );
        }
        if (categoryId) {
          products = products.filter((p) =>
            p.categories?.some((c) => c.id.toString() === categoryId),
          );
        }
      } else {
        // manufacturerId + categoryId
        products = await this.productsRepository.findManyByManufacturer(
          new UniqueEntityID(manufacturerId!),
          tenantId,
        );
        if (categoryId) {
          products = products.filter((p) =>
            p.categories?.some((c) => c.id.toString() === categoryId),
          );
        }
      }

      if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter((p) =>
          p.name.toLowerCase().includes(searchLower),
        );
      }

      return this.paginateInMemory(products, page, limit);
    }

    // Single filter or no filter — use paginated repository methods
    if (templateId) {
      const result = await this.productsRepository.findManyByTemplatePaginated(
        new UniqueEntityID(templateId),
        tenantId,
        { page, limit },
      );
      return this.buildResponse(
        result.data,
        result.total,
        result.page,
        result.limit,
        result.totalPages,
      );
    }

    if (manufacturerId) {
      const result =
        await this.productsRepository.findManyByManufacturerPaginated(
          new UniqueEntityID(manufacturerId),
          tenantId,
          { page, limit },
        );
      return this.buildResponse(
        result.data,
        result.total,
        result.page,
        result.limit,
        result.totalPages,
      );
    }

    if (categoryId) {
      const result = await this.productsRepository.findManyByCategoryPaginated(
        new UniqueEntityID(categoryId),
        tenantId,
        { page, limit },
      );
      return this.buildResponse(
        result.data,
        result.total,
        result.page,
        result.limit,
        result.totalPages,
      );
    }

    // No filters (search may still apply)
    const result = await this.productsRepository.findManyPaginated(tenantId, {
      page,
      limit,
      search,
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

  private paginateInMemory(
    products: Product[],
    page: number,
    limit: number,
  ): ListProductsUseCaseResponse {
    const total = products.length;
    const start = (page - 1) * limit;
    const paginated = products.slice(start, start + limit);

    return this.buildResponse(
      paginated,
      total,
      page,
      limit,
      Math.ceil(total / limit),
    );
  }
}
