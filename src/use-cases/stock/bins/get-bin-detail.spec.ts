import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetBinDetailUseCase } from './get-bin-detail';

let binsRepository: InMemoryBinsRepository;
let itemsRepository: InMemoryItemsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: GetBinDetailUseCase;

describe('GetBinDetailUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    itemsRepository = new InMemoryItemsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new GetBinDetailUseCase(
      binsRepository,
      itemsRepository,
      zonesRepository,
      warehousesRepository,
    );
  });

  it('should throw ResourceNotFoundError for non-existent bin', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
