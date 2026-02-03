import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListAvailableBinsUseCase } from './list-available-bins';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let sut: ListAvailableBinsUseCase;

describe('ListAvailableBinsUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    sut = new ListAvailableBinsUseCase(binsRepository, zonesRepository);
  });

  it('should throw ResourceNotFoundError for non-existent zone', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', zoneId: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
