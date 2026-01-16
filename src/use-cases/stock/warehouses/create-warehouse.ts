import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { Warehouse } from '@/entities/stock/warehouse';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';

interface CreateWarehouseUseCaseRequest {
  code: string;
  name: string;
  description?: string;
  address?: string;
  isActive?: boolean;
}

interface CreateWarehouseUseCaseResponse {
  warehouse: Warehouse;
}

export class CreateWarehouseUseCase {
  constructor(private warehousesRepository: WarehousesRepository) {}

  async execute({
    code,
    name,
    description,
    address,
    isActive = true,
  }: CreateWarehouseUseCaseRequest): Promise<CreateWarehouseUseCaseResponse> {
    // Validate code length
    if (code.length < 2 || code.length > 5) {
      throw new BadRequestError(
        'Warehouse code must be between 2 and 5 characters.',
      );
    }

    // Check if code already exists
    const existingWarehouse = await this.warehousesRepository.findByCode(code);

    if (existingWarehouse) {
      throw new BadRequestError('A warehouse with this code already exists.');
    }

    const warehouse = await this.warehousesRepository.create({
      code: code.toUpperCase(),
      name,
      description,
      address,
      isActive,
    });

    return { warehouse };
  }
}
