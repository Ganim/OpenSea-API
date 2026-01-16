import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
    ZoneStructure,
    type ZoneStructureProps,
} from '@/entities/stock/value-objects/zone-structure';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';
import { validateZoneStructureInput } from './helpers/validate-zone-structure';

interface PreviewZoneStructureUseCaseRequest {
  zoneId: string;
  structure: ZoneStructureProps;
}

interface BinPreview {
  address: string;
  aisle: number;
  shelf: number;
  position: string;
}

interface PreviewZoneStructureUseCaseResponse {
  totalBins: number;
  totalShelves: number;
  totalAisles: number;
  sampleBins: BinPreview[];
}

export class PreviewZoneStructureUseCase {
  constructor(
    private zonesRepository: ZonesRepository,
    private warehousesRepository: WarehousesRepository,
  ) {}

  async execute({
    zoneId,
    structure,
  }: PreviewZoneStructureUseCaseRequest): Promise<PreviewZoneStructureUseCaseResponse> {
    const zoneEntityId = new UniqueEntityID(zoneId);

    // Check if zone exists
    const zone = await this.zonesRepository.findById(zoneEntityId);

    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    // Get warehouse for code generation
    const warehouse = await this.warehousesRepository.findById(
      zone.warehouseId,
    );

    if (!warehouse) {
      throw new ResourceNotFoundError('Warehouse');
    }

    validateZoneStructureInput(structure);

    const zoneStructure = ZoneStructure.fromJSON(structure);

    if (zoneStructure.totalBins < 1) {
      throw new BadRequestError(
        'Zone structure must include aisles, shelves per aisle, and bins per shelf.',
      );
    }

    // Generate sample bins (first 10, middle 5, last 5)
    const allBins = zoneStructure.generateBinData(warehouse.code, zone.code);
    const sampleBins: BinPreview[] = [];

    // First 10
    sampleBins.push(...allBins.slice(0, 10));

    // Middle 5 (if enough bins)
    if (allBins.length > 20) {
      const middleStart = Math.floor(allBins.length / 2) - 2;
      sampleBins.push(...allBins.slice(middleStart, middleStart + 5));
    }

    // Last 5 (if enough bins and not already included)
    if (allBins.length > 15) {
      sampleBins.push(...allBins.slice(-5));
    }

    return {
      totalBins: zoneStructure.totalBins,
      totalShelves: zoneStructure.totalShelves,
      totalAisles: zoneStructure.aisles,
      sampleBins,
    };
  }
}
