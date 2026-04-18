import { beforeEach, describe, expect, it } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchDevice } from '@/entities/hr/punch-device';
import { InMemoryPunchDevicesRepository } from '@/repositories/hr/in-memory/in-memory-punch-devices-repository';
import { DeletePunchDeviceUseCase } from './delete-punch-device';

let repo: InMemoryPunchDevicesRepository;
let sut: DeletePunchDeviceUseCase;
let tenantId: string;

describe('DeletePunchDeviceUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryPunchDevicesRepository();
    sut = new DeletePunchDeviceUseCase(repo);
    tenantId = new UniqueEntityID().toString();
  });

  it('faz soft-delete do device (deletedAt preenchido, findById retorna null)', async () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(tenantId),
      name: 'To Delete',
      deviceKind: 'KIOSK_PUBLIC',
    });
    await repo.create(device);

    await sut.execute({ tenantId, deviceId: device.id.toString() });

    expect(repo.items[0].deletedAt).toBeInstanceOf(Date);
    const found = await repo.findById(device.id, tenantId);
    expect(found).toBeNull();
  });

  it('lança ResourceNotFoundError quando device não existe', async () => {
    await expect(
      sut.execute({
        tenantId,
        deviceId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('lança ResourceNotFoundError quando device é de outro tenant', async () => {
    const other = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'Other',
      deviceKind: 'KIOSK_PUBLIC',
    });
    await repo.create(other);

    await expect(
      sut.execute({ tenantId, deviceId: other.id.toString() }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
