import { VolumeNotFoundError } from '@/@errors/volumes-errors';
import { Volume } from '@/entities/stock/volume';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { VolumeItem } from '@/entities/stock/volume-item';
import { InMemoryVolumesRepository } from '@/repositories/stock/in-memory/in-memory-volumes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetVolumeByIdUseCase } from './get-volume-by-id';

describe('GetVolumeByIdUseCase', () => {
  let volumesRepository: InMemoryVolumesRepository;
  let sut: GetVolumeByIdUseCase;

  beforeEach(() => {
    volumesRepository = new InMemoryVolumesRepository();
    sut = new GetVolumeByIdUseCase(volumesRepository);
  });

  it('should throw error if volume not found', async () => {
    await expect(
      sut.execute({
        volumeId: 'non-existent-id',
      }),
    ).rejects.toThrow(VolumeNotFoundError);
  });

  it('should return volume by id', async () => {
    const volume = Volume.create({
      code: 'VOL-001',
      name: 'Volume Test',
      status: VolumeStatus.OPEN,
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    const result = await sut.execute({
      volumeId: volume.id.toString(),
    });

    expect(result.volume.id).toBe(volume.id.toString());
    expect(result.volume.code).toBe('VOL-001');
    expect(result.volume.name).toBe('Volume Test');
    expect(result.volume.itemCount).toBe(0);
  });

  it('should return volume with item count', async () => {
    const volume = Volume.create({
      code: 'VOL-002',
      name: 'Volume with Items',
      status: VolumeStatus.OPEN,
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    // Add some items
    await volumesRepository.addItem(
      VolumeItem.create({
        volumeId: volume.id.toString(),
        itemId: 'product-item-1',
        addedAt: new Date(),
        addedBy: 'user-1',
      }),
    );

    await volumesRepository.addItem(
      VolumeItem.create({
        volumeId: volume.id.toString(),
        itemId: 'product-item-2',
        addedAt: new Date(),
        addedBy: 'user-1',
      }),
    );

    const result = await sut.execute({
      volumeId: volume.id.toString(),
    });

    expect(result.volume.itemCount).toBe(2);
  });
});
