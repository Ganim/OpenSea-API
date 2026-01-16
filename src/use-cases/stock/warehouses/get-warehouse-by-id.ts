import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Warehouse } from '@/entities/stock/warehouse';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';

interface GetWarehouseByIdUseCaseRequest {
  id: string;
}

interface GetWarehouseByIdUseCaseResponse {
  warehouse: Warehouse;
  zoneCount: number;
}

export class GetWarehouseByIdUseCase {
  constructor(private warehousesRepository: WarehousesRepository) {}

  async execute({
    id,
  }: GetWarehouseByIdUseCaseRequest): Promise<GetWarehouseByIdUseCaseResponse> {
    const warehouseId = new UniqueEntityID(id);

    const warehouse = await this.warehousesRepository.findById(warehouseId);

    if (!warehouse) {
      throw new ResourceNotFoundError('Warehouse');
    }

    const zoneCount = await this.warehousesRepository.countZones(warehouseId);

    return { warehouse, zoneCount };
  }
}
