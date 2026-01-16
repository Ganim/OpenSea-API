import { Volume } from '@/entities/stock/volume';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { InMemoryVolumesRepository } from '@/repositories/stock/in-memory/in-memory-volumes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListVolumesUseCase } from './list-volumes';

describe('ListVolumesUseCase', () => {
  let volumesRepository: InMemoryVolumesRepository;
  let sut: ListVolumesUseCase;

  beforeEach(() => {
    volumesRepository = new InMemoryVolumesRepository();
    sut = new ListVolumesUseCase(volumesRepository);
  });

  it('should list volumes with default pagination', async () => {
    const result = await sut.execute({});

    expect(result).toBeDefined();
    expect(result.volumes).toBeDefined();
    expect(Array.isArray(result.volumes)).toBe(true);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('should list volumes with custom pagination', async () => {
    const result = await sut.execute({
      page: 2,
      limit: 20,
    });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
  });

  it('should calculate total pages correctly', async () => {
    // Create 15 volumes
    for (let i = 0; i < 15; i++) {
      const volume = Volume.create({
        code: `VOL-${i.toString().padStart(3, '0')}`,
        name: `Volume ${i}`,
        status: VolumeStatus.OPEN,
        createdBy: 'user-1',
      });
      await volumesRepository.create(volume);
    }

    const result = await sut.execute({
      page: 1,
      limit: 10,
    });

    expect(result.totalPages).toBe(2);
    expect(result.total).toBe(15);
    expect(result.volumes.length).toBe(10);
  });

  it('should return created volumes', async () => {
    const volume1 = Volume.create({
      code: 'VOL-001',
      name: 'Volume 1',
      status: VolumeStatus.OPEN,
      createdBy: 'user-1',
    });

    const volume2 = Volume.create({
      code: 'VOL-002',
      name: 'Volume 2',
      status: VolumeStatus.CLOSED,
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume1);
    await volumesRepository.create(volume2);

    const result = await sut.execute({});

    expect(result.volumes.length).toBe(2);
    expect(result.total).toBe(2);
  });
});
