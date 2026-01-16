import {
  VolumeItemNotFoundError,
  VolumeNotFoundError,
} from '@/@errors/volumes-errors';
import { Volume } from '@/entities/stock/volume';
import { VolumeItem } from '@/entities/stock/volume-item';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { InMemoryVolumesRepository } from '@/repositories/stock/in-memory/in-memory-volumes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RemoveItemFromVolumeUseCase } from './remove-item-from-volume';

describe('RemoveItemFromVolumeUseCase', () => {
  let volumesRepository: InMemoryVolumesRepository;
  let sut: RemoveItemFromVolumeUseCase;

  beforeEach(() => {
    volumesRepository = new InMemoryVolumesRepository();
    sut = new RemoveItemFromVolumeUseCase(volumesRepository);
  });

  it('should throw error if volume not found', async () => {
    await expect(
      sut.execute({
        volumeId: 'non-existent-id',
        itemId: 'item-1',
      }),
    ).rejects.toThrow(VolumeNotFoundError);
  });

  it('should throw error if item not found in volume', async () => {
    const volume = Volume.create({
      code: 'VOL-001',
      name: 'Volume Test',
      status: VolumeStatus.OPEN,
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    await expect(
      sut.execute({
        volumeId: volume.id.toString(),
        itemId: 'item-1',
      }),
    ).rejects.toThrow(VolumeItemNotFoundError);
  });

  it('should remove item from volume successfully', async () => {
    const volume = Volume.create({
      code: 'VOL-001',
      name: 'Volume Test',
      status: VolumeStatus.OPEN,
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    // Add item first
    const volumeItem = VolumeItem.create({
      volumeId: volume.id.toString(),
      itemId: 'item-1',
      addedBy: 'user-1',
    });
    await volumesRepository.addItem(volumeItem);

    // Remove the item
    const result = await sut.execute({
      volumeId: volume.id.toString(),
      itemId: 'item-1',
    });

    expect(result.success).toBe(true);

    // Verify the item is removed
    const items = await volumesRepository.getItemsByVolumeId(volume.id.toString());
    expect(items.length).toBe(0);
  });
});
