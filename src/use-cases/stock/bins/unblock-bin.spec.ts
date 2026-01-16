import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnblockBinUseCase } from './unblock-bin';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: UnblockBinUseCase;

describe('UnblockBinUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new UnblockBinUseCase(binsRepository);
  });

  async function createTestBin(isBlocked = true) {
    const warehouse = await warehousesRepository.create({
      code: 'FAB',
      name: 'Fábrica Principal',
    });

    const zone = await zonesRepository.create({
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
    });

    const bin = await binsRepository.create({
      zoneId: zone.zoneId,
      address: 'FAB-EST-101-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
      isBlocked,
      blockReason: isBlocked ? 'Em manutenção' : undefined,
    });

    return { warehouse, zone, bin };
  }

  it('should unblock a bin', async () => {
    const { bin } = await createTestBin(true);

    const result = await sut.execute({
      id: bin.binId.toString(),
    });

    expect(result.bin.isBlocked).toBe(false);
    expect(result.bin.blockReason).toBeNull();
  });

  it('should fail when bin is not found', async () => {
    await expect(() =>
      sut.execute({
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when bin is not blocked', async () => {
    const { bin } = await createTestBin(false);

    await expect(() =>
      sut.execute({
        id: bin.binId.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should persist the unblocked bin', async () => {
    const { bin } = await createTestBin(true);

    await sut.execute({
      id: bin.binId.toString(),
    });

    const savedBin = await binsRepository.findById(bin.binId);
    expect(savedBin?.isBlocked).toBe(false);
    expect(savedBin?.blockReason).toBeNull();
  });
});
