import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetBinByAddressUseCase } from './get-bin-by-address';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: GetBinByAddressUseCase;

describe('GetBinByAddressUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new GetBinByAddressUseCase(binsRepository);
  });

  async function createTestBin() {
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

    const bin = await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId,
      address: 'FAB-EST-101-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
      capacity: 100,
    });

    return { warehouse, zone, bin };
  }

  it('should get bin by address', async () => {
    const { bin } = await createTestBin();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      address: 'FAB-EST-101-A',
    });

    expect(result.bin).toBeDefined();
    expect(result.bin.binId.equals(bin.binId)).toBe(true);
    expect(result.bin.address).toBe('FAB-EST-101-A');
  });

  it('should find bin with case insensitive address', async () => {
    const { bin } = await createTestBin();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      address: 'fab-est-101-a',
    });

    expect(result.bin.binId.equals(bin.binId)).toBe(true);
  });

  it('should include item count', async () => {
    await createTestBin();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      address: 'FAB-EST-101-A',
    });

    expect(result.itemCount).toBe(0);
  });

  it('should include item count when items exist', async () => {
    await createTestBin();

    vi.spyOn(binsRepository, 'countItemsInBin').mockResolvedValue(10);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      address: 'FAB-EST-101-A',
    });

    expect(result.itemCount).toBe(10);
  });

  it('should fail when bin is not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        address: 'NON-EXISTENT-ADDRESS',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not find deleted bin', async () => {
    const { bin } = await createTestBin();

    await binsRepository.delete(bin.binId);

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        address: 'FAB-EST-101-A',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
