import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { BlockBinUseCase } from './block-bin';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: BlockBinUseCase;

describe('BlockBinUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new BlockBinUseCase(binsRepository);
  });

  async function createTestBin(isBlocked = false) {
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
      blockReason: isBlocked ? 'Previous block' : undefined,
    });

    return { warehouse, zone, bin };
  }

  it('should block a bin', async () => {
    const { bin } = await createTestBin();

    const result = await sut.execute({
      id: bin.binId.toString(),
      reason: 'Em manutenção',
    });

    expect(result.bin.isBlocked).toBe(true);
    expect(result.bin.blockReason).toBe('Em manutenção');
  });

  it('should trim reason', async () => {
    const { bin } = await createTestBin();

    const result = await sut.execute({
      id: bin.binId.toString(),
      reason: '  Em manutenção  ',
    });

    expect(result.bin.blockReason).toBe('Em manutenção');
  });

  it('should fail when bin is not found', async () => {
    await expect(() =>
      sut.execute({
        id: new UniqueEntityID().toString(),
        reason: 'Em manutenção',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when bin is already blocked', async () => {
    const { bin } = await createTestBin(true);

    await expect(() =>
      sut.execute({
        id: bin.binId.toString(),
        reason: 'Nova razão',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when reason is empty', async () => {
    const { bin } = await createTestBin();

    await expect(() =>
      sut.execute({
        id: bin.binId.toString(),
        reason: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when reason is only whitespace', async () => {
    const { bin } = await createTestBin();

    await expect(() =>
      sut.execute({
        id: bin.binId.toString(),
        reason: '   ',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should persist the blocked bin', async () => {
    const { bin } = await createTestBin();

    await sut.execute({
      id: bin.binId.toString(),
      reason: 'Em manutenção',
    });

    const savedBin = await binsRepository.findById(bin.binId);
    expect(savedBin?.isBlocked).toBe(true);
    expect(savedBin?.blockReason).toBe('Em manutenção');
  });
});
