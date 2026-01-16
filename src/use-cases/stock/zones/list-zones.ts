import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Zone } from '@/entities/stock/zone';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

interface ListZonesUseCaseRequest {
  warehouseId?: string;
  activeOnly?: boolean;
}

interface ListZonesUseCaseResponse {
  zones: Zone[];
}

export class ListZonesUseCase {
  constructor(private zonesRepository: ZonesRepository) {}

  async execute({
    warehouseId,
    activeOnly = false,
  }: ListZonesUseCaseRequest = {}): Promise<ListZonesUseCaseResponse> {
    let zones: Zone[];

    if (warehouseId) {
      const warehouseEntityId = new UniqueEntityID(warehouseId);
      zones = activeOnly
        ? await this.zonesRepository.findManyActiveByWarehouse(
            warehouseEntityId,
          )
        : await this.zonesRepository.findManyByWarehouse(warehouseEntityId);
    } else {
      zones = activeOnly
        ? await this.zonesRepository.findManyActive()
        : await this.zonesRepository.findMany();
    }

    return { zones };
  }
}
