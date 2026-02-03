import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Warehouse } from '@/entities/stock/warehouse';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';

interface UpdateWarehouseUseCaseRequest {
  tenantId: string;
  id: string;
  code?: string;
  name?: string;
  description?: string | null;
  address?: string | null;
  isActive?: boolean;
}

interface UpdateWarehouseUseCaseResponse {
  warehouse: Warehouse;
}

export class UpdateWarehouseUseCase {
  constructor(private warehousesRepository: WarehousesRepository) {}

  async execute({
    tenantId,
    id,
    code,
    name,
    description,
    address,
    isActive,
  }: UpdateWarehouseUseCaseRequest): Promise<UpdateWarehouseUseCaseResponse> {
    const warehouseId = new UniqueEntityID(id);

    // Check if warehouse exists
    const existingWarehouse = await this.warehousesRepository.findById(
      warehouseId,
      tenantId,
    );

    if (!existingWarehouse) {
      throw new ResourceNotFoundError('Warehouse');
    }

    // Validate code if provided
    if (code !== undefined) {
      if (code.length < 2 || code.length > 5) {
        throw new BadRequestError(
          'Warehouse code must be between 2 and 5 characters.',
        );
      }

      // Check for duplicate code (excluding current warehouse)
      const warehouseWithSameCode = await this.warehousesRepository.findByCode(
        code,
        tenantId,
      );
      if (
        warehouseWithSameCode &&
        !warehouseWithSameCode.warehouseId.equals(warehouseId)
      ) {
        throw new BadRequestError('A warehouse with this code already exists.');
      }
    }

    const warehouse = await this.warehousesRepository.update({
      id: warehouseId,
      code,
      name,
      description,
      address,
      isActive,
    });

    if (!warehouse) {
      throw new ResourceNotFoundError('Warehouse');
    }

    return { warehouse };
  }
}
