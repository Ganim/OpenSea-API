import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

export interface AddressSuggestion {
  address: string;
  binId: string;
  warehouseCode: string;
  warehouseName: string;
  zoneCode: string;
  zoneName: string;
  aisle: number;
  shelf: number;
  position: string;
  isAvailable: boolean;
  occupancy: {
    current: number;
    capacity: number | null;
  };
}

interface SuggestAddressUseCaseRequest {
  tenantId: string;
  partial: string;
  limit?: number;
}

interface SuggestAddressUseCaseResponse {
  suggestions: AddressSuggestion[];
  query: string;
  total: number;
}

export class SuggestAddressUseCase {
  constructor(
    private binsRepository: BinsRepository,
    private zonesRepository: ZonesRepository,
    private warehousesRepository: WarehousesRepository,
  ) {}

  async execute(
    input: SuggestAddressUseCaseRequest,
  ): Promise<SuggestAddressUseCaseResponse> {
    const { tenantId, partial, limit = 10 } = input;

    // Search for bins matching the partial address
    const bins = await this.binsRepository.search(partial, tenantId, limit);

    if (bins.length === 0) {
      return {
        suggestions: [],
        query: partial,
        total: 0,
      };
    }

    // Cache for zones and warehouses
    const zoneCache = new Map<
      string,
      { code: string; name: string; warehouseId: string }
    >();
    const warehouseCache = new Map<string, { code: string; name: string }>();

    const suggestions: AddressSuggestion[] = [];

    for (const bin of bins) {
      const zoneId = bin.zoneId.toString();

      // Get zone info from cache or fetch
      if (!zoneCache.has(zoneId)) {
        const zone = await this.zonesRepository.findById(bin.zoneId, tenantId);
        if (!zone) continue;
        zoneCache.set(zoneId, {
          code: zone.code,
          name: zone.name,
          warehouseId: zone.warehouseId.toString(),
        });
      }

      const zoneInfo = zoneCache.get(zoneId)!;
      const warehouseId = zoneInfo.warehouseId;

      // Get warehouse info from cache or fetch
      if (!warehouseCache.has(warehouseId)) {
        const warehouse = await this.warehousesRepository.findById(
          new UniqueEntityID(warehouseId),
          tenantId,
        );
        if (!warehouse) continue;
        warehouseCache.set(warehouseId, {
          code: warehouse.code,
          name: warehouse.name,
        });
      }

      const warehouseInfo = warehouseCache.get(warehouseId)!;

      suggestions.push({
        address: bin.address,
        binId: bin.binId.toString(),
        warehouseCode: warehouseInfo.code,
        warehouseName: warehouseInfo.name,
        zoneCode: zoneInfo.code,
        zoneName: zoneInfo.name,
        aisle: bin.aisle,
        shelf: bin.shelf,
        position: bin.position,
        isAvailable: bin.isAvailable,
        occupancy: {
          current: bin.currentOccupancy,
          capacity: bin.capacity,
        },
      });
    }

    return {
      suggestions,
      query: partial,
      total: suggestions.length,
    };
  }
}
