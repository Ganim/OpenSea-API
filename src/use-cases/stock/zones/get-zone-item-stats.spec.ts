import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetZoneItemStatsUseCase } from './get-zone-item-stats';

let zonesRepository: InMemoryZonesRepository;
let binsRepository: InMemoryBinsRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: GetZoneItemStatsUseCase;

describe('GetZoneItemStatsUseCase', () => {
  beforeEach(() => {
    zonesRepository = new InMemoryZonesRepository();
    binsRepository = new InMemoryBinsRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new GetZoneItemStatsUseCase(zonesRepository, binsRepository);
  });

  it('should return zone item stats', async () => {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'WH1',
      name: 'Warehouse 1',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'ZN1',
      name: 'Zone 1',
    });

    await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId,
      address: 'WH1-ZN1-01-01-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId,
      address: 'WH1-ZN1-01-01-B',
      aisle: 1,
      shelf: 1,
      position: 'B',
    });

    await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId,
      address: 'WH1-ZN1-01-02-A',
      aisle: 1,
      shelf: 2,
      position: 'A',
      isBlocked: true,
      blockReason: 'Under maintenance',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
    });

    expect(result.totalBins).toBe(3);
    expect(result.blockedBins).toBe(1);
    expect(result.activeBins).toBe(2);
    // In-memory countItemsPerBin returns 0 for all bins
    expect(result.occupiedBins).toBe(0);
    expect(result.totalItems).toBe(0);
    expect(result.itemsInBlockedBins).toBe(0);
  });

  it('should throw ResourceNotFoundError when zone not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        zoneId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should return zero stats when zone has no bins', async () => {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'WH1',
      name: 'Warehouse 1',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'ZN1',
      name: 'Zone 1',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
    });

    expect(result.totalBins).toBe(0);
    expect(result.activeBins).toBe(0);
    expect(result.blockedBins).toBe(0);
    expect(result.occupiedBins).toBe(0);
    expect(result.totalItems).toBe(0);
    expect(result.itemsInBlockedBins).toBe(0);
  });
});
