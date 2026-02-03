import { VolumeNotFoundError } from '@/@errors/volumes-errors';
import { Volume } from '@/entities/stock/volume';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VolumeItem } from '@/entities/stock/volume-item';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { InMemoryVolumesRepository } from '@/repositories/stock/in-memory/in-memory-volumes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetRomaneioUseCase } from './get-romaneio';

describe('GetRomaneioUseCase', () => {
  let volumesRepository: InMemoryVolumesRepository;
  let sut: GetRomaneioUseCase;

  beforeEach(() => {
    volumesRepository = new InMemoryVolumesRepository();
    sut = new GetRomaneioUseCase(volumesRepository);
  });

  it('should throw error if volume not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        volumeId: 'non-existent-id',
      }),
    ).rejects.toThrow(VolumeNotFoundError);
  });

  it('should get romaneio with empty items', async () => {
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

    expect(result.romaneio.volumeCode).toBe('VOL-001');
    expect(result.romaneio.totalItems).toBe(0);
    expect(result.romaneio.items).toHaveLength(0);
  });

  it('should get romaneio with items', async () => {
    const volume = Volume.create({
      tenantId: new UniqueEntityID('tenant-1'),
      code: 'VOL-002',
      name: 'Volume with Items',
      status: VolumeStatus.OPEN,
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    // Add items
    const item1 = VolumeItem.create({
      volumeId: volume.id.toString(),
      itemId: 'item-1',
      addedBy: 'user-1',
    });

    const item2 = VolumeItem.create({
      volumeId: volume.id.toString(),
      itemId: 'item-2',
      addedBy: 'user-2',
    });

    await volumesRepository.addItem(item1);
    await volumesRepository.addItem(item2);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      volumeId: volume.id.toString(),
    });

    expect(result.romaneio.volumeCode).toBe('VOL-002');
    expect(result.romaneio.totalItems).toBe(2);
    expect(result.romaneio.items).toHaveLength(2);
    expect(result.romaneio.generatedAt).toBeInstanceOf(Date);
  });
});
