import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetBinOccupancyMapUseCase } from './get-bin-occupancy-map';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let sut: GetBinOccupancyMapUseCase;

describe('GetBinOccupancyMapUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    sut = new GetBinOccupancyMapUseCase(binsRepository, zonesRepository);
  });

  it('should throw ResourceNotFoundError for non-existent zone', async () => {
    await expect(() =>
      sut.execute({ zoneId: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
