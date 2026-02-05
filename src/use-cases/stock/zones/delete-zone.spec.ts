import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryItemMovementsRepository } from '@/repositories/stock/in-memory/in-memory-item-movements-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteZoneUseCase } from './delete-zone';

let zonesRepository: InMemoryZonesRepository;
let binsRepository: InMemoryBinsRepository;
let itemsRepository: InMemoryItemsRepository;
let itemMovementsRepository: InMemoryItemMovementsRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: DeleteZoneUseCase;

describe('DeleteZoneUseCase', () => {
  beforeEach(() => {
    zonesRepository = new InMemoryZonesRepository();
    binsRepository = new InMemoryBinsRepository();
    itemsRepository = new InMemoryItemsRepository();
    itemMovementsRepository = new InMemoryItemMovementsRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new DeleteZoneUseCase(zonesRepository, binsRepository, itemsRepository, itemMovementsRepository);
  });

  async function createTestZone() {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Fábrica Principal',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
    });

    return { warehouse, zone };
  }

  it('should delete a zone without bins', async () => {
    const { zone } = await createTestZone();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: zone.zoneId.toString(),
      userId: 'user-1',
    });

    expect(result.success).toBe(true);
    expect(result.deletedBinsCount).toBe(0);

    const deletedZone = await zonesRepository.findById(zone.zoneId, 'tenant-1');
    expect(deletedZone).toBeNull();
  });

  it('should fail when zone is not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: new UniqueEntityID().toString(),
        userId: 'user-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when zone has bins and forceDeleteBins is false', async () => {
    const { zone } = await createTestZone();

    vi.spyOn(zonesRepository, 'countBins').mockResolvedValue(5);

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: zone.zoneId.toString(),
        userId: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail with message including bin count', async () => {
    const { zone } = await createTestZone();

    vi.spyOn(zonesRepository, 'countBins').mockResolvedValue(10);

    try {
      await sut.execute({
        tenantId: 'tenant-1',
        id: zone.zoneId.toString(),
        userId: 'user-1',
      });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).message).toContain('10 bin(s)');
    }
  });

  it('should delete zone with bins when forceDeleteBins is true', async () => {
    const { zone } = await createTestZone();

    // Create some bins
    await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId,
      address: 'FAB-EST-101-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId,
      address: 'FAB-EST-102-B',
      aisle: 1,
      shelf: 2,
      position: 'B',
    });

    vi.spyOn(zonesRepository, 'countBins').mockResolvedValue(2);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: zone.zoneId.toString(),
      forceDeleteBins: true,
      userId: 'user-1',
    });

    expect(result.success).toBe(true);
    expect(result.deletedBinsCount).toBe(2);
  });

  it('should soft delete zone', async () => {
    const { zone } = await createTestZone();

    await sut.execute({
      tenantId: 'tenant-1',
      id: zone.zoneId.toString(),
      userId: 'user-1',
    });

    const zoneInArray = zonesRepository.zones.find((z) =>
      z.zoneId.equals(zone.zoneId),
    );
    expect(zoneInArray).toBeDefined();
    expect(zoneInArray?.deletedAt).not.toBeNull();
  });
});
