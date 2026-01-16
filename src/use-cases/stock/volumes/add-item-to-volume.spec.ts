import {
  VolumeItemAlreadyExistsError,
  VolumeNotFoundError,
} from '@/@errors/volumes-errors';
import { Volume } from '@/entities/stock/volume';
import { VolumeItem } from '@/entities/stock/volume-item';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { InMemoryVolumesRepository } from '@/repositories/stock/in-memory/in-memory-volumes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AddItemToVolumeUseCase } from './add-item-to-volume';

describe('AddItemToVolumeUseCase', () => {
  let volumesRepository: InMemoryVolumesRepository;
  let sut: AddItemToVolumeUseCase;

  beforeEach(() => {
    volumesRepository = new InMemoryVolumesRepository();
    sut = new AddItemToVolumeUseCase(volumesRepository);
  });

  it('should throw error if volume not found', async () => {
    await expect(
      sut.execute({
        volumeId: 'non-existent-id',
        itemId: 'item-1',
        addedBy: 'user-1',
      }),
    ).rejects.toThrow(VolumeNotFoundError);
  });

  it('should throw error if item already exists in volume', async () => {
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

    // Try to add same item again
    await expect(
      sut.execute({
        volumeId: volume.id.toString(),
        itemId: 'item-1',
        addedBy: 'user-1',
      }),
    ).rejects.toThrow(VolumeItemAlreadyExistsError);
  });

  it('should add item to volume successfully', async () => {
    const volume = Volume.create({
      code: 'VOL-001',
      name: 'Volume Test',
      status: VolumeStatus.OPEN,
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    const result = await sut.execute({
      volumeId: volume.id.toString(),
      itemId: 'item-1',
      addedBy: 'user-2',
    });

    expect(result.volumeItem).toBeDefined();
    expect(result.volumeItem.volumeId).toBe(volume.id.toString());
    expect(result.volumeItem.itemId).toBe('item-1');
    expect(result.volumeItem.addedBy).toBe('user-2');
  });
});
