import { VolumeNotFoundError } from '@/@errors/volumes-errors';
import { Volume } from '@/entities/stock/volume';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { InMemoryVolumesRepository } from '@/repositories/stock/in-memory/in-memory-volumes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReopenVolumeUseCase } from './reopen-volume';

describe('ReopenVolumeUseCase', () => {
  let volumesRepository: InMemoryVolumesRepository;
  let sut: ReopenVolumeUseCase;

  beforeEach(() => {
    volumesRepository = new InMemoryVolumesRepository();
    sut = new ReopenVolumeUseCase(volumesRepository);
  });

  it('should throw error if volume not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        volumeId: 'non-existent-id',
      }),
    ).rejects.toThrow(VolumeNotFoundError);
  });

  it('should reopen volume successfully', async () => {
    const volume = Volume.create({
      tenantId: new UniqueEntityID('tenant-1'),
      code: 'VOL-001',
      name: 'Volume Test',
      status: VolumeStatus.CLOSED,
      closedAt: new Date(),
      closedBy: 'user-1',
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      volumeId: volume.id.toString(),
    });

    expect(result.volume.status).toBe(VolumeStatus.OPEN);
    expect(result.volume.closedAt).toBeNull();
    expect(result.volume.closedBy).toBeNull();
  });
});
