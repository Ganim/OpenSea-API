import type { Manufacturer } from '@/entities/stock/manufacturer';
import { ManufacturersRepository } from '@/repositories/stock/manufacturers-repository';

interface ListManufacturersUseCaseRequest {
  tenantId: string;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface ListManufacturersUseCaseResponse {
  manufacturers: Manufacturer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListManufacturersUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(
    request: ListManufacturersUseCaseRequest,
  ): Promise<ListManufacturersUseCaseResponse> {
    const { tenantId, search, sortBy, sortOrder } = request;
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const result = await this.manufacturersRepository.findManyPaginated(
      tenantId,
      {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      },
    );

    return {
      manufacturers: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.totalPages,
      },
    };
  }
}
