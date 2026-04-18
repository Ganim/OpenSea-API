import { beforeEach, describe, expect, it } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchDevice } from '@/entities/hr/punch-device';
import { InMemoryPunchDevicesRepository } from '@/repositories/hr/in-memory/in-memory-punch-devices-repository';
import { UnpairPunchDeviceUseCase } from './unpair-punch-device';

let repo: InMemoryPunchDevicesRepository;
let sut: UnpairPunchDeviceUseCase;
let tenantId: string;

describe('UnpairPunchDeviceUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryPunchDevicesRepository();
    sut = new UnpairPunchDeviceUseCase(repo);
    tenantId = new UniqueEntityID().toString();
  });

  it('revoga device pareado e propaga em findByDeviceTokenHash', async () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(tenantId),
      name: 'Kiosk',
      deviceKind: 'KIOSK_PUBLIC',
    });
    device.pair('token-hash', 'label', 'admin-01');
    await repo.create(device);

    // Antes: encontra o device via hash
    expect(await repo.findByDeviceTokenHash('token-hash')).not.toBeNull();

    await sut.execute({
      tenantId,
      deviceId: device.id.toString(),
      revokedByUserId: 'admin-99',
      reason: 'comprometido',
    });

    expect(device.revokedAt).toBeInstanceOf(Date);
    expect(device.revokedByUserId).toBe('admin-99');
    expect(device.revokedReason).toBe('comprometido');

    // Depois: lookup por token agora retorna null (PUNCH-CORE-08)
    expect(await repo.findByDeviceTokenHash('token-hash')).toBeNull();
  });

  it('é idempotente — chamar em device já revogado não lança erro', async () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(tenantId),
      name: 'Already Revoked',
      deviceKind: 'KIOSK_PUBLIC',
    });
    device.pair('h', 'l', 'u');
    device.revoke('u-old', 'razão antiga');
    await repo.create(device);

    await expect(
      sut.execute({
        tenantId,
        deviceId: device.id.toString(),
        revokedByUserId: 'u-new',
        reason: 'razão nova',
      }),
    ).resolves.toBeUndefined();

    expect(device.revokedByUserId).toBe('u-new');
    expect(device.revokedReason).toBe('razão nova');
  });

  it('lança ResourceNotFoundError quando device não existe', async () => {
    await expect(
      sut.execute({
        tenantId,
        deviceId: new UniqueEntityID().toString(),
        revokedByUserId: 'admin',
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
      sut.execute({
        tenantId,
        deviceId: other.id.toString(),
        revokedByUserId: 'admin',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
