import type { Warehouse } from '@/entities/stock/warehouse';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';

interface ListWarehousesUseCaseRequest {
  tenantId: string;
  activeOnly?: boolean;
}

interface ListWarehousesUseCaseResponse {
  warehouses: Warehouse[];
}

export class ListWarehousesUseCase {
  constructor(private warehousesRepository: WarehousesRepository) {}

  async execute({
    tenantId,
    activeOnly = false,
  }: ListWarehousesUseCaseRequest): Promise<ListWarehousesUseCaseResponse> {
    const warehouses = activeOnly
      ? await this.warehousesRepository.findManyActive(tenantId)
      : await this.warehousesRepository.findMany(tenantId);

    return { warehouses };
  }
}
