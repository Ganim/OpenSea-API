import { VolumeNotFoundError } from '@/@errors/volumes-errors';
import { Volume } from '@/entities/stock/volume';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { InMemoryVolumesRepository } from '@/repositories/stock/in-memory/in-memory-volumes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReturnVolumeUseCase } from './return-volume';

describe('ReturnVolumeUseCase', () => {
  let volumesRepository: InMemoryVolumesRepository;
  let sut: ReturnVolumeUseCase;

  beforeEach(() => {
    volumesRepository = new InMemoryVolumesRepository();
    sut = new ReturnVolumeUseCase(volumesRepository);
  });

  it('should throw error if volume not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        volumeId: 'non-existent-id',
      }),
    ).rejects.toThrow(VolumeNotFoundError);
  });

  it('should return volume successfully', async () => {
    const volume = Volume.create({
      tenantId: new UniqueEntityID('tenant-1'),
      code: 'VOL-001',
      name: 'Volume Test',
      status: VolumeStatus.DELIVERED,
      deliveredAt: new Date(),
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      volumeId: volume.id.toString(),
    });

    expect(result.volume.status).toBe(VolumeStatus.RETURNED);
    expect(result.volume.returnedAt).toBeDefined();
  });
});
