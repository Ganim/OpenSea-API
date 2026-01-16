import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';

interface DeleteWarehouseUseCaseRequest {
  id: string;
}

interface DeleteWarehouseUseCaseResponse {
  success: boolean;
}

export class DeleteWarehouseUseCase {
  constructor(private warehousesRepository: WarehousesRepository) {}

  async execute({
    id,
  }: DeleteWarehouseUseCaseRequest): Promise<DeleteWarehouseUseCaseResponse> {
    const warehouseId = new UniqueEntityID(id);

    // Check if warehouse exists
    const warehouse = await this.warehousesRepository.findById(warehouseId);

    if (!warehouse) {
      throw new ResourceNotFoundError('Warehouse');
    }

    // Check if warehouse has zones
    const zoneCount = await this.warehousesRepository.countZones(warehouseId);

    if (zoneCount > 0) {
      throw new BadRequestError(
        `Cannot delete warehouse with ${zoneCount} zone(s). Delete all zones first.`,
      );
    }

    await this.warehousesRepository.delete(warehouseId);

    return { success: true };
  }
}
