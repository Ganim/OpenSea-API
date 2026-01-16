import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

export interface LabelData {
  binId: string;
  address: string;
  warehouseCode: string;
  warehouseName: string;
  zoneCode: string;
  zoneName: string;
  aisle: number;
  shelf: number;
  position: string;
  codeData: string;
}

interface GenerateLabelsUseCaseRequest {
  binIds: string[];
  format: 'qr' | 'barcode';
  size: 'small' | 'medium' | 'large';
  includeWarehouse?: boolean;
  includeZone?: boolean;
}

interface GenerateLabelsUseCaseResponse {
  labels: LabelData[];
  format: 'qr' | 'barcode';
  size: 'small' | 'medium' | 'large';
  totalLabels: number;
}

export class GenerateLabelsUseCase {
  constructor(
    private binsRepository: BinsRepository,
    private zonesRepository: ZonesRepository,
    private warehousesRepository: WarehousesRepository,
  ) {}

  async execute(
    input: GenerateLabelsUseCaseRequest,
  ): Promise<GenerateLabelsUseCaseResponse> {
    const {
      binIds,
      format,
      size,
      includeWarehouse = true,
      includeZone = true,
    } = input;

    // Fetch all bins by IDs
    const uniqueIds = binIds.map((id) => new UniqueEntityID(id));
    const bins = await this.binsRepository.findManyByIds(uniqueIds);

    if (bins.length === 0) {
      throw new ResourceNotFoundError(
        'Nenhum bin encontrado com os IDs fornecidos',
      );
    }

    // Cache for zones and warehouses to avoid multiple queries
    const zoneCache = new Map<
      string,
      { code: string; name: string; warehouseId: string }
    >();
    const warehouseCache = new Map<string, { code: string; name: string }>();

    const labels: LabelData[] = [];

    for (const bin of bins) {
      const zoneId = bin.zoneId.toString();

      // Get zone info from cache or fetch
      if (!zoneCache.has(zoneId)) {
        const zone = await this.zonesRepository.findById(bin.zoneId);
        if (!zone) {
          continue; // Skip bins with missing zones
        }
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
        );
        if (!warehouse) {
          continue; // Skip bins with missing warehouses
        }
        warehouseCache.set(warehouseId, {
          code: warehouse.code,
          name: warehouse.name,
        });
      }

      const warehouseInfo = warehouseCache.get(warehouseId)!;

      // Build code data based on options
      let codeData = bin.address;
      if (!includeWarehouse && !includeZone) {
        // Just the position part (e.g., "102-B")
        const parts = bin.address.split('-');
        codeData = parts.slice(2).join('-');
      } else if (!includeWarehouse) {
        // Zone + position (e.g., "EST-102-B")
        const parts = bin.address.split('-');
        codeData = parts.slice(1).join('-');
      }

      labels.push({
        binId: bin.binId.toString(),
        address: bin.address,
        warehouseCode: warehouseInfo.code,
        warehouseName: warehouseInfo.name,
        zoneCode: zoneInfo.code,
        zoneName: zoneInfo.name,
        aisle: bin.aisle,
        shelf: bin.shelf,
        position: bin.position,
        codeData,
      });
    }

    return {
      labels,
      format,
      size,
      totalLabels: labels.length,
    };
  }
}
