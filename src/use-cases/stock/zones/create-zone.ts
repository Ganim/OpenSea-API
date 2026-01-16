import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
    ZoneStructure,
    type ZoneStructureProps,
} from '@/entities/stock/value-objects/zone-structure';
import type { Zone } from '@/entities/stock/zone';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';
import { validateZoneStructureInput } from './helpers/validate-zone-structure';

interface CreateZoneUseCaseRequest {
  warehouseId: string;
  code: string;
  name: string;
  description?: string;
  structure?: Partial<ZoneStructureProps>;
  isActive?: boolean;
}

interface CreateZoneUseCaseResponse {
  zone: Zone;
}

export class CreateZoneUseCase {
  constructor(
    private zonesRepository: ZonesRepository,
    private warehousesRepository: WarehousesRepository,
  ) {}

  async execute({
    warehouseId,
    code,
    name,
    description,
    structure,
    isActive = true,
  }: CreateZoneUseCaseRequest): Promise<CreateZoneUseCaseResponse> {
    // Validate code length
    if (code.length < 2 || code.length > 5) {
      throw new BadRequestError(
        'Zone code must be between 2 and 5 characters.',
      );
    }

    const warehouseEntityId = new UniqueEntityID(warehouseId);

    // Check if warehouse exists
    const warehouse =
      await this.warehousesRepository.findById(warehouseEntityId);

    if (!warehouse) {
      throw new ResourceNotFoundError('Warehouse');
    }

    // Check if zone with same code exists in this warehouse
    const existingZone = await this.zonesRepository.findByCode(
      warehouseEntityId,
      code,
    );

    if (existingZone) {
      throw new BadRequestError(
        'A zone with this code already exists in this warehouse.',
      );
    }

    let structureToPersist = ZoneStructure.empty().toJSON();

    if (structure) {
      validateZoneStructureInput(structure, { allowEmpty: true });

      const normalizedStructure = ZoneStructure.create(structure);

      if (normalizedStructure.totalBins > 10000) {
        throw new BadRequestError(
          `Configuration would create ${normalizedStructure.totalBins} bins. Maximum is 10,000 bins per zone.`,
        );
      }

      structureToPersist = normalizedStructure.toJSON();
    }

    const zone = await this.zonesRepository.create({
      warehouseId: warehouseEntityId,
      code: code.toUpperCase(),
      name,
      description,
      structure: structureToPersist,
      isActive,
    });

    return { zone };
  }
}
