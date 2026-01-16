import type { Warehouse } from '@/entities/stock/warehouse';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';

interface ListWarehousesUseCaseRequest {
  activeOnly?: boolean;
}

interface ListWarehousesUseCaseResponse {
  warehouses: Warehouse[];
}

export class ListWarehousesUseCase {
  constructor(private warehousesRepository: WarehousesRepository) {}

  async execute({
    activeOnly = false,
  }: ListWarehousesUseCaseRequest = {}): Promise<ListWarehousesUseCaseResponse> {
    const warehouses = activeOnly
      ? await this.warehousesRepository.findManyActive()
      : await this.warehousesRepository.findMany();

    return { warehouses };
  }
}
