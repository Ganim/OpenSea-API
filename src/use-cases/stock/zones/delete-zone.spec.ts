import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteZoneUseCase } from './delete-zone';

let zonesRepository: InMemoryZonesRepository;
let binsRepository: InMemoryBinsRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: DeleteZoneUseCase;

describe('DeleteZoneUseCase', () => {
  beforeEach(() => {
    zonesRepository = new InMemoryZonesRepository();
    binsRepository = new InMemoryBinsRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new DeleteZoneUseCase(zonesRepository, binsRepository);
  });

  async function createTestZone() {
    const warehouse = await warehousesRepository.create({
      code: 'FAB',
      name: 'Fábrica Principal',
    });

    const zone = await zonesRepository.create({
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
    });

    return { warehouse, zone };
  }

  it('should delete a zone without bins', async () => {
    const { zone } = await createTestZone();

    const result = await sut.execute({
      id: zone.zoneId.toString(),
    });

    expect(result.success).toBe(true);
    expect(result.deletedBinsCount).toBe(0);

    const deletedZone = await zonesRepository.findById(zone.zoneId);
    expect(deletedZone).toBeNull();
  });

  it('should fail when zone is not found', async () => {
    await expect(() =>
      sut.execute({
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when zone has bins and forceDeleteBins is false', async () => {
    const { zone } = await createTestZone();

    vi.spyOn(zonesRepository, 'countBins').mockResolvedValue(5);

    await expect(() =>
      sut.execute({
        id: zone.zoneId.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail with message including bin count', async () => {
    const { zone } = await createTestZone();

    vi.spyOn(zonesRepository, 'countBins').mockResolvedValue(10);

    try {
      await sut.execute({
        id: zone.zoneId.toString(),
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
      zoneId: zone.zoneId,
      address: 'FAB-EST-101-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    await binsRepository.create({
      zoneId: zone.zoneId,
      address: 'FAB-EST-102-B',
      aisle: 1,
      shelf: 2,
      position: 'B',
    });

    vi.spyOn(zonesRepository, 'countBins').mockResolvedValue(2);

    const result = await sut.execute({
      id: zone.zoneId.toString(),
      forceDeleteBins: true,
    });

    expect(result.success).toBe(true);
    expect(result.deletedBinsCount).toBe(2);
  });

  it('should soft delete zone', async () => {
    const { zone } = await createTestZone();

    await sut.execute({
      id: zone.zoneId.toString(),
    });

    const zoneInArray = zonesRepository.zones.find((z) =>
      z.zoneId.equals(zone.zoneId),
    );
    expect(zoneInArray).toBeDefined();
    expect(zoneInArray?.deletedAt).not.toBeNull();
  });
});
