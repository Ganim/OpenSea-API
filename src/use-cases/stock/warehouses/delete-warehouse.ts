import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';

interface DeleteWarehouseUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteWarehouseUseCaseResponse {
  success: boolean;
}

export class DeleteWarehouseUseCase {
  constructor(private warehousesRepository: WarehousesRepository) {}

  async execute({
    tenantId,
    id,
  }: DeleteWarehouseUseCaseRequest): Promise<DeleteWarehouseUseCaseResponse> {
    const warehouseId = new UniqueEntityID(id);

    // Check if warehouse exists
    const warehouse = await this.warehousesRepository.findById(
      warehouseId,
      tenantId,
    );

    if (!warehouse) {
      throw new ResourceNotFoundError('Warehouse');
    }

    // Check if warehouse has zones
    const zoneCount = await this.warehousesRepository.countZones(warehouseId);

    if (zoneCount > 0) {
      throw new BadRequestError(
        `Não é possível excluir o armazém com ${zoneCount} zona(s). Exclua todas as zonas primeiro.`,
      );
    }

    // Check for items in warehouse bins
    const itemCount = await this.warehousesRepository.countItems(
      warehouseId,
      tenantId,
    );

    if (itemCount > 0) {
      throw new BadRequestError(
        `Não é possível excluir o armazém com ${itemCount} item(ns) em estoque. Remova ou transfira os itens primeiro.`,
      );
    }

    await this.warehousesRepository.delete(warehouseId);

    return { success: true };
  }
}
