import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ZoneStructure,
  type ZoneStructureProps,
} from '@/entities/stock/value-objects/zone-structure';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';
import { computeZoneDiff } from './helpers/compute-zone-diff';
import { validateZoneStructureInput } from './helpers/validate-zone-structure';

interface PreviewZoneReconfigurationUseCaseRequest {
  tenantId: string;
  zoneId: string;
  structure: ZoneStructureProps;
}

export interface ReconfigurationPreviewResult {
  binsToPreserve: number;
  binsToCreate: number;
  binsToDeleteEmpty: number;
  binsWithItems: Array<{
    binId: string;
    address: string;
    itemCount: number;
  }>;
  totalAffectedItems: number;
  addressUpdates: number;
  isFirstConfiguration: boolean;
  totalNewBins: number;
}

export class PreviewZoneReconfigurationUseCase {
  constructor(
    private zonesRepository: ZonesRepository,
    private binsRepository: BinsRepository,
    private warehousesRepository: WarehousesRepository,
  ) {}

  async execute({
    tenantId,
    zoneId,
    structure,
  }: PreviewZoneReconfigurationUseCaseRequest): Promise<ReconfigurationPreviewResult> {
    const zoneEntityId = new UniqueEntityID(zoneId);

    const zone = await this.zonesRepository.findById(zoneEntityId, tenantId);
    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    const warehouse = await this.warehousesRepository.findById(
      zone.warehouseId,
      tenantId,
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

    if (zoneStructure.totalBins > 10000) {
      throw new BadRequestError(
        `Configuration would create ${zoneStructure.totalBins} bins. Maximum is 10,000 bins per zone.`,
      );
    }

    const existingBins = await this.binsRepository.findManyByZone(
      zoneEntityId,
      tenantId,
    );

    const newBinData = zoneStructure.generateBinData(
      warehouse.code,
      zone.code,
    );

    if (existingBins.length === 0) {
      return {
        binsToPreserve: 0,
        binsToCreate: newBinData.length,
        binsToDeleteEmpty: 0,
        binsWithItems: [],
        totalAffectedItems: 0,
        addressUpdates: 0,
        isFirstConfiguration: true,
        totalNewBins: newBinData.length,
      };
    }

    const binItemCounts = await this.binsRepository.countItemsPerBin(
      zoneEntityId,
      tenantId,
    );

    const diff = computeZoneDiff(existingBins, newBinData, binItemCounts);

    const addressUpdates = diff.toPreserve.filter(
      (p) => p.addressChanged,
    ).length;

    const binsWithItems = diff.toBlock.map((b) => ({
      binId: b.bin.binId.toString(),
      address: b.bin.address,
      itemCount: b.itemCount,
    }));

    const totalAffectedItems = diff.toBlock.reduce(
      (sum, b) => sum + b.itemCount,
      0,
    );

    return {
      binsToPreserve: diff.toPreserve.length,
      binsToCreate: diff.toCreate.length,
      binsToDeleteEmpty: diff.toDelete.length,
      binsWithItems,
      totalAffectedItems,
      addressUpdates,
      isFirstConfiguration: false,
      totalNewBins: newBinData.length,
    };
  }
}
