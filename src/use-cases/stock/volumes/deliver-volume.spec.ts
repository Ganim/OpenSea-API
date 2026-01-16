import { VolumeNotFoundError } from '@/@errors/volumes-errors';
import { Volume } from '@/entities/stock/volume';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { InMemoryVolumesRepository } from '@/repositories/stock/in-memory/in-memory-volumes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeliverVolumeUseCase } from './deliver-volume';

describe('DeliverVolumeUseCase', () => {
  let volumesRepository: InMemoryVolumesRepository;
  let sut: DeliverVolumeUseCase;

  beforeEach(() => {
    volumesRepository = new InMemoryVolumesRepository();
    sut = new DeliverVolumeUseCase(volumesRepository);
  });

  it('should throw error if volume not found', async () => {
    await expect(
      sut.execute({
        volumeId: 'non-existent-id',
        deliveredBy: 'user-1',
      }),
    ).rejects.toThrow(VolumeNotFoundError);
  });

  it('should deliver volume successfully', async () => {
    const volume = Volume.create({
      code: 'VOL-001',
      name: 'Volume Test',
      status: VolumeStatus.CLOSED,
      closedAt: new Date(),
      closedBy: 'user-1',
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    const result = await sut.execute({
      volumeId: volume.id.toString(),
      deliveredBy: 'user-2',
    });

    expect(result.volume.status).toBe(VolumeStatus.DELIVERED);
    expect(result.volume.deliveredAt).toBeDefined();
    expect(result.volume.deliveredBy).toBe('user-2');
  });
});
