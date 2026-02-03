import {
  InvalidVolumeStatusError,
  VolumeNotFoundError,
} from '@/@errors/volumes-errors';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { Volume } from '@/entities/stock/volume';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryVolumesRepository } from '@/repositories/stock/in-memory/in-memory-volumes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateVolumeUseCase } from './update-volume';

describe('UpdateVolumeUseCase', () => {
  let volumesRepository: InMemoryVolumesRepository;
  let sut: UpdateVolumeUseCase;

  beforeEach(() => {
    volumesRepository = new InMemoryVolumesRepository();
    sut = new UpdateVolumeUseCase(volumesRepository);
  });

  it('should throw error if volume not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        volumeId: 'non-existent-id',
        name: 'Updated Name',
      }),
    ).rejects.toThrow(VolumeNotFoundError);
  });

  it('should throw error if status is invalid', async () => {
    const volume = Volume.create({
      tenantId: new UniqueEntityID('tenant-1'),
      code: 'VOL-001',
      name: 'Volume Test',
      status: VolumeStatus.OPEN,
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        volumeId: volume.id.toString(),
        status: 'INVALID_STATUS',
      }),
    ).rejects.toThrow(InvalidVolumeStatusError);
  });

  it('should update volume name successfully', async () => {
    const volume = Volume.create({
      tenantId: new UniqueEntityID('tenant-1'),
      code: 'VOL-001',
      name: 'Original Name',
      status: VolumeStatus.OPEN,
      createdBy: 'user-1',
    });

    await volumesRepository.create(volume);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      volumeId: volume.id.toString(),
      name: 'Updated Name',
    });

    expect(result.volume.name).toBe('Updated Name');
  });

  it('should update volume notes successfully', async () => {
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
      notes: 'Some notes',
    });

    expect(result.volume.notes).toBe('Some notes');
  });

  it('should update volume status successfully', async () => {
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
      status: VolumeStatus.CLOSED,
    });

    expect(result.volume.status).toBe(VolumeStatus.CLOSED);
  });
});
