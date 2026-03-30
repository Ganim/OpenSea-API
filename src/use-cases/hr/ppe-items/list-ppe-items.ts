import type { PPEItem, PPECategory } from '@/entities/hr/ppe-item';
import type { PPEItemsRepository } from '@/repositories/hr/ppe-items-repository';

export interface ListPPEItemsRequest {
  tenantId: string;
  category?: PPECategory;
  isActive?: boolean;
  lowStockOnly?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface ListPPEItemsResponse {
  ppeItems: PPEItem[];
  total: number;
}

export class ListPPEItemsUseCase {
  constructor(private ppeItemsRepository: PPEItemsRepository) {}

  async execute(request: ListPPEItemsRequest): Promise<ListPPEItemsResponse> {
    const { tenantId, ...filters } = request;

    const { ppeItems, total } = await this.ppeItemsRepository.findMany(
      tenantId,
      filters,
    );

    return { ppeItems, total };
  }
}
