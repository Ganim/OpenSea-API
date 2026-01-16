import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateBinUseCase } from './update-bin';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: UpdateBinUseCase;

describe('UpdateBinUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new UpdateBinUseCase(binsRepository);
  });

  async function createTestBin(options?: {
    capacity?: number;
    currentOccupancy?: number;
  }) {
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
      capacity: options?.capacity ?? 100,
      currentOccupancy: options?.currentOccupancy ?? 0,
      isActive: true,
    });

    return { warehouse, zone, bin };
  }

  it('should update bin capacity', async () => {
    const { bin } = await createTestBin();

    const result = await sut.execute({
      id: bin.binId.toString(),
      capacity: 200,
    });

    expect(result.bin.capacity).toBe(200);
  });

  it('should clear bin capacity with null', async () => {
    const { bin } = await createTestBin({ capacity: 100 });

    const result = await sut.execute({
      id: bin.binId.toString(),
      capacity: null,
    });

    expect(result.bin.capacity).toBeNull();
  });

  it('should update bin active status', async () => {
    const { bin } = await createTestBin();

    const result = await sut.execute({
      id: bin.binId.toString(),
      isActive: false,
    });

    expect(result.bin.isActive).toBe(false);
  });

  it('should update multiple fields at once', async () => {
    const { bin } = await createTestBin();

    const result = await sut.execute({
      id: bin.binId.toString(),
      capacity: 200,
      isActive: false,
    });

    expect(result.bin.capacity).toBe(200);
    expect(result.bin.isActive).toBe(false);
  });

  it('should fail when bin is not found', async () => {
    await expect(() =>
      sut.execute({
        id: new UniqueEntityID().toString(),
        capacity: 100,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when capacity is negative', async () => {
    const { bin } = await createTestBin();

    await expect(() =>
      sut.execute({
        id: bin.binId.toString(),
        capacity: -1,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when capacity is less than current occupancy', async () => {
    const { bin } = await createTestBin({
      capacity: 100,
      currentOccupancy: 50,
    });

    await expect(() =>
      sut.execute({
        id: bin.binId.toString(),
        capacity: 30,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow capacity equal to current occupancy', async () => {
    const { bin } = await createTestBin({
      capacity: 100,
      currentOccupancy: 50,
    });

    const result = await sut.execute({
      id: bin.binId.toString(),
      capacity: 50,
    });

    expect(result.bin.capacity).toBe(50);
  });

  it('should allow capacity greater than current occupancy', async () => {
    const { bin } = await createTestBin({
      capacity: 100,
      currentOccupancy: 50,
    });

    const result = await sut.execute({
      id: bin.binId.toString(),
      capacity: 75,
    });

    expect(result.bin.capacity).toBe(75);
  });
});
