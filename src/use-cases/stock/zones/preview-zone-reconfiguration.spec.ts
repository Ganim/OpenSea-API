import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PreviewZoneReconfigurationUseCase } from './preview-zone-reconfiguration';

let zonesRepository: InMemoryZonesRepository;
let binsRepository: InMemoryBinsRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: PreviewZoneReconfigurationUseCase;

describe('PreviewZoneReconfigurationUseCase', () => {
  beforeEach(() => {
    zonesRepository = new InMemoryZonesRepository();
    binsRepository = new InMemoryBinsRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new PreviewZoneReconfigurationUseCase(
      zonesRepository,
      binsRepository,
      warehousesRepository,
    );
  });

  it('should return first configuration preview (no existing bins)', async () => {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Main Warehouse',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'Z1',
      name: 'Zone 1',
      structure: ZoneStructure.empty().toJSON(),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      structure: {
        aisles: 2,
        shelvesPerAisle: 3,
        binsPerShelf: 4,
        codePattern: ZoneStructure.empty().codePattern.toJSON(),
      },
    });

    expect(result.isFirstConfiguration).toBe(true);
    expect(result.binsToCreate).toBe(24);
    expect(result.binsToPreserve).toBe(0);
    expect(result.binsToDeleteEmpty).toBe(0);
    expect(result.binsWithItems).toHaveLength(0);
    expect(result.totalAffectedItems).toBe(0);
    expect(result.addressUpdates).toBe(0);
    expect(result.totalNewBins).toBe(24);
  });

  it('should throw ResourceNotFoundError when zone not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        zoneId: new UniqueEntityID().toString(),
        structure: {
          aisles: 2,
          shelvesPerAisle: 3,
          binsPerShelf: 4,
          codePattern: ZoneStructure.empty().codePattern.toJSON(),
        },
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when warehouse not found', async () => {
    // Create zone with a warehouseId that does not exist in warehousesRepository
    const fakeWarehouseId = new UniqueEntityID();

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: fakeWarehouseId,
      code: 'Z1',
      name: 'Zone 1',
      structure: ZoneStructure.empty().toJSON(),
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        zoneId: zone.zoneId.toString(),
        structure: {
          aisles: 2,
          shelvesPerAisle: 3,
          binsPerShelf: 4,
          codePattern: ZoneStructure.empty().codePattern.toJSON(),
        },
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError when structure would create 0 bins', async () => {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Main Warehouse',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'Z1',
      name: 'Zone 1',
      structure: ZoneStructure.empty().toJSON(),
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        zoneId: zone.zoneId.toString(),
        structure: {
          aisles: 0,
          shelvesPerAisle: 0,
          binsPerShelf: 0,
          codePattern: ZoneStructure.empty().codePattern.toJSON(),
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when structure would create > 10000 bins', async () => {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Main Warehouse',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'Z1',
      name: 'Zone 1',
      structure: ZoneStructure.empty().toJSON(),
    });

    // 99 aisles * 999 shelves * 1 bin = 98,901 bins (> 10,000)
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        zoneId: zone.zoneId.toString(),
        structure: {
          aisles: 99,
          shelvesPerAisle: 999,
          binsPerShelf: 1,
          codePattern: ZoneStructure.empty().codePattern.toJSON(),
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
