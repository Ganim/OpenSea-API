import type { PriceTableDTO } from '@/mappers/sales/price-table/price-table-to-dto';
import { priceTableToDTO } from '@/mappers/sales/price-table/price-table-to-dto';
import type { PriceTablesRepository } from '@/repositories/sales/price-tables-repository';

interface ListPriceTablesUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  type?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListPriceTablesUseCaseResponse {
  priceTables: PriceTableDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListPriceTablesUseCase {
  constructor(private priceTablesRepository: PriceTablesRepository) {}

  async execute(
    request: ListPriceTablesUseCaseRequest,
  ): Promise<ListPriceTablesUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const result = await this.priceTablesRepository.findManyPaginated({
      tenantId: request.tenantId,
      page,
      limit,
      type: request.type,
      isActive: request.isActive,
      search: request.search,
      sortBy: request.sortBy,
      sortOrder: request.sortOrder,
    });

    return {
      priceTables: result.data.map(priceTableToDTO),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
