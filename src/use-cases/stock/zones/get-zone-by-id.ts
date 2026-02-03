import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Zone } from '@/entities/stock/zone';
import type { Warehouse } from '@/entities/stock/warehouse';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';

interface GetZoneByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetZoneByIdUseCaseResponse {
  zone: Zone;
  warehouse: Warehouse;
  binCount: number;
}

export class GetZoneByIdUseCase {
  constructor(
    private zonesRepository: ZonesRepository,
    private warehousesRepository: WarehousesRepository,
  ) {}

  async execute({
    tenantId,
    id,
  }: GetZoneByIdUseCaseRequest): Promise<GetZoneByIdUseCaseResponse> {
    const zoneId = new UniqueEntityID(id);

    const zone = await this.zonesRepository.findById(zoneId, tenantId);

    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    const [warehouse, binCount] = await Promise.all([
      this.warehousesRepository.findById(zone.warehouseId, tenantId),
      this.zonesRepository.countBins(zoneId),
    ]);

    if (!warehouse) {
      throw new ResourceNotFoundError('Warehouse');
    }

    return { zone, warehouse, binCount };
  }
}
