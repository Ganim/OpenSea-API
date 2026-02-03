import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PreviewZoneStructureUseCase } from './preview-zone-structure';

let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: PreviewZoneStructureUseCase;

describe('PreviewZoneStructureUseCase', () => {
  beforeEach(() => {
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new PreviewZoneStructureUseCase(
      zonesRepository,
      warehousesRepository,
    );
  });

  it('should preview uniform structure', async () => {
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

    expect(result.totalBins).toBe(24);
    expect(result.totalShelves).toBe(6);
    expect(result.totalAisles).toBe(2);
    expect(result.sampleBins.length).toBeGreaterThan(0);
    expect(result.sampleBins.length).toBeLessThanOrEqual(20);
  });

  it('should preview independent aisle configurations', async () => {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Main Warehouse',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'Z2',
      name: 'Zone 2',
      structure: ZoneStructure.empty().toJSON(),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      structure: {
        aisles: 2,
        shelvesPerAisle: 10,
        binsPerShelf: 5,
        aisleConfigs: [
          { aisleNumber: 1, shelvesCount: 10, binsPerShelf: 5 },
          { aisleNumber: 2, shelvesCount: 3, binsPerShelf: 2 },
        ],
        codePattern: ZoneStructure.empty().codePattern.toJSON(),
      },
    });

    expect(result.totalBins).toBe(56);
    expect(result.totalShelves).toBe(13);
    expect(result.totalAisles).toBe(2);
    expect(result.sampleBins.length).toBeGreaterThan(0);
  });

  it('should fail with invalid aisles count', async () => {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Main Warehouse',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'Z3',
      name: 'Zone 3',
      structure: ZoneStructure.empty().toJSON(),
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        zoneId: zone.zoneId.toString(),
        structure: {
          aisles: 100,
          shelvesPerAisle: 1,
          binsPerShelf: 1,
          codePattern: ZoneStructure.empty().codePattern.toJSON(),
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail with empty structure', async () => {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Main Warehouse',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'Z4',
      name: 'Zone 4',
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
});
