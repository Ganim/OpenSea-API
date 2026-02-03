import { VolumeNotFoundError } from '@/@errors/volumes-errors';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { Volume } from '@/entities/stock/volume';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryVolumesRepository } from '@/repositories/stock/in-memory/in-memory-volumes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteVolumeUseCase } from './delete-volume';

describe('DeleteVolumeUseCase', () => {
  let volumesRepository: InMemoryVolumesRepository;
  let sut: DeleteVolumeUseCase;

  beforeEach(() => {
    volumesRepository = new InMemoryVolumesRepository();
    sut = new DeleteVolumeUseCase(volumesRepository);
  });

  it('should throw error if volume not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        volumeId: 'non-existent-id',
      }),
    ).rejects.toThrow(VolumeNotFoundError);
  });

  it('should delete volume successfully', async () => {
    const volume = Volume.create({
      tenantId: new UniqueEntityID('tenant-1'),
      code: 'VOL-001',
      name: 'Volume Test',
      status: VolumeStatus.OPEN,
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      volumeId: volume.id.toString(),
    });

    expect(result.success).toBe(true);

    // Verify the volume is soft deleted
    const deletedVolume = await volumesRepository.findById(
      volume.id.toString(),
      'tenant-1',
    );
    expect(deletedVolume).toBeNull();
  });
});
