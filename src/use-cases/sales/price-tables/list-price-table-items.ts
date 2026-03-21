import type { PriceTableItemDTO } from '@/mappers/sales/price-table-item/price-table-item-to-dto';
import { priceTableItemToDTO } from '@/mappers/sales/price-table-item/price-table-item-to-dto';
import type { PriceTableItemsRepository } from '@/repositories/sales/price-table-items-repository';

interface ListPriceTableItemsUseCaseRequest {
  tenantId: string;
  priceTableId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListPriceTableItemsUseCaseResponse {
  items: PriceTableItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListPriceTableItemsUseCase {
  constructor(private priceTableItemsRepository: PriceTableItemsRepository) {}

  async execute(
    request: ListPriceTableItemsUseCaseRequest,
  ): Promise<ListPriceTableItemsUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const result = await this.priceTableItemsRepository.findManyByTable({
      priceTableId: request.priceTableId,
      tenantId: request.tenantId,
      page,
      limit,
      sortBy: request.sortBy,
      sortOrder: request.sortOrder,
    });

    return {
      items: result.data.map(priceTableItemToDTO),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
