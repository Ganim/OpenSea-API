import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ZoneStructure,
  type ZoneStructureProps,
} from '@/entities/stock/value-objects/zone-structure';
import type { Zone } from '@/entities/stock/zone';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';
import { validateZoneStructureInput } from './helpers/validate-zone-structure';

interface ConfigureZoneStructureUseCaseRequest {
  tenantId: string;
  zoneId: string;
  structure: ZoneStructureProps;
  regenerateBins?: boolean;
}

interface ConfigureZoneStructureUseCaseResponse {
  zone: Zone;
  binsCreated: number;
  binsDeleted: number;
}

export class ConfigureZoneStructureUseCase {
  constructor(
    private zonesRepository: ZonesRepository,
    private binsRepository: BinsRepository,
    private warehousesRepository: WarehousesRepository,
  ) {}

  async execute({
    tenantId,
    zoneId,
    structure,
    regenerateBins = true,
  }: ConfigureZoneStructureUseCaseRequest): Promise<ConfigureZoneStructureUseCaseResponse> {
    const zoneEntityId = new UniqueEntityID(zoneId);

    // Check if zone exists
    const zone = await this.zonesRepository.findById(zoneEntityId, tenantId);

    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    // Get warehouse for code generation
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

    const totalBins = zoneStructure.totalBins;

    // Warn if creating too many bins
    if (totalBins > 10000) {
      throw new BadRequestError(
        `Configuration would create ${totalBins} bins. Maximum is 10,000 bins per zone.`,
      );
    }

    let binsDeleted = 0;
    let binsCreated = 0;

    if (regenerateBins) {
      // Delete existing bins
      binsDeleted = await this.binsRepository.deleteByZone(zoneEntityId);

      // Generate new bins
      const binData = zoneStructure.generateBinData(warehouse.code, zone.code);

      binsCreated = await this.binsRepository.createMany({
        tenantId,
        zoneId: zoneEntityId,
        bins: binData,
      });
    }

    // Update zone structure
    const updatedZone = await this.zonesRepository.updateStructure({
      id: zoneEntityId,
      structure: zoneStructure.toJSON(),
    });

    if (!updatedZone) {
      throw new ResourceNotFoundError('Zone');
    }

    return {
      zone: updatedZone,
      binsCreated,
      binsDeleted,
    };
  }
}
