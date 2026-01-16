import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetBinByIdUseCase } from './get-bin-by-id';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: GetBinByIdUseCase;

describe('GetBinByIdUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new GetBinByIdUseCase(binsRepository);
  });

  async function createTestBin() {
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
      capacity: 100,
    });

    return { warehouse, zone, bin };
  }

  it('should get bin by id', async () => {
    const { bin } = await createTestBin();

    const result = await sut.execute({
      id: bin.binId.toString(),
    });

    expect(result.bin).toBeDefined();
    expect(result.bin.address).toBe('FAB-EST-101-A');
    expect(result.bin.aisle).toBe(1);
    expect(result.bin.shelf).toBe(1);
    expect(result.bin.position).toBe('A');
    expect(result.bin.capacity).toBe(100);
  });

  it('should include item count', async () => {
    const { bin } = await createTestBin();

    const result = await sut.execute({
      id: bin.binId.toString(),
    });

    expect(result.itemCount).toBe(0);
  });

  it('should include item count when items exist', async () => {
    const { bin } = await createTestBin();

    vi.spyOn(binsRepository, 'countItemsInBin').mockResolvedValue(15);

    const result = await sut.execute({
      id: bin.binId.toString(),
    });

    expect(result.itemCount).toBe(15);
  });

  it('should fail when bin is not found', async () => {
    await expect(() =>
      sut.execute({
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not find deleted bin', async () => {
    const { bin } = await createTestBin();

    await binsRepository.delete(bin.binId);

    await expect(() =>
      sut.execute({
        id: bin.binId.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
