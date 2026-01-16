import { VolumeCannotBeClosed, VolumeNotFoundError } from '@/@errors/volumes-errors';
import { Volume } from '@/entities/stock/volume';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { InMemoryVolumesRepository } from '@/repositories/stock/in-memory/in-memory-volumes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CloseVolumeUseCase } from './close-volume';

describe('CloseVolumeUseCase', () => {
  let volumesRepository: InMemoryVolumesRepository;
  let sut: CloseVolumeUseCase;

  beforeEach(() => {
    volumesRepository = new InMemoryVolumesRepository();
    sut = new CloseVolumeUseCase(volumesRepository);
  });

  it('should throw error if volume not found', async () => {
    await expect(
      sut.execute({
        volumeId: 'non-existent-id',
        closedBy: 'user-1',
      }),
    ).rejects.toThrow(VolumeNotFoundError);
  });

  it('should throw error if volume cannot be closed', async () => {
    const volume = Volume.create({
      code: 'VOL-001',
      name: 'Volume Test',
      status: VolumeStatus.CLOSED,
      closedAt: new Date(),
      closedBy: 'user-1',
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    await expect(
      sut.execute({
        volumeId: volume.id.toString(),
        closedBy: 'user-1',
      }),
    ).rejects.toThrow(VolumeCannotBeClosed);
  });

  it('should close volume successfully', async () => {
    const volume = Volume.create({
      code: 'VOL-001',
      name: 'Volume Test',
      status: VolumeStatus.OPEN,
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    const result = await sut.execute({
      volumeId: volume.id.toString(),
      closedBy: 'user-2',
    });

    expect(result.volume).toBeDefined();
    expect(result.volume.status).toBe(VolumeStatus.CLOSED);
    expect(result.volume.closedAt).toBeDefined();
    expect(result.volume.closedBy).toBe('user-2');
  });
});
