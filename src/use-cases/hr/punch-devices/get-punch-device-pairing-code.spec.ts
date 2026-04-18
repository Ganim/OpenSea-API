import { beforeEach, describe, expect, it } from 'vitest';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchDevice } from '@/entities/hr/punch-device';
import { InMemoryPunchDevicesRepository } from '@/repositories/hr/in-memory/in-memory-punch-devices-repository';
import { GetPunchDevicePairingCodeUseCase } from './get-punch-device-pairing-code';

let repo: InMemoryPunchDevicesRepository;
let sut: GetPunchDevicePairingCodeUseCase;
let tenantId: string;

describe('GetPunchDevicePairingCodeUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryPunchDevicesRepository();
    sut = new GetPunchDevicePairingCodeUseCase(repo);
    tenantId = new UniqueEntityID().toString();
  });

  it('retorna code (6 chars) e expiresAt (Date) para device não pareado', async () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(tenantId),
      name: 'Device',
      deviceKind: 'KIOSK_PUBLIC',
    });
    await repo.create(device);

    const result = await sut.execute({
      tenantId,
      deviceId: device.id.toString(),
    });

    expect(result.code).toHaveLength(6);
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('lança ResourceNotFoundError quando device não existe', async () => {
    await expect(
      sut.execute({
        tenantId,
        deviceId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('lança ResourceNotFoundError quando device pertence a outro tenant', async () => {
    const otherTenant = new UniqueEntityID().toString();
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(otherTenant),
      name: 'Device',
      deviceKind: 'KIOSK_PUBLIC',
    });
    await repo.create(device);

    await expect(
      sut.execute({
        tenantId,
        deviceId: device.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('lança BadRequestError quando device já está pareado', async () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(tenantId),
      name: 'Already Paired',
      deviceKind: 'KIOSK_PUBLIC',
    });
    device.pair('hash', 'label', 'user');
    await repo.create(device);

    await expect(
      sut.execute({
        tenantId,
        deviceId: device.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lança BadRequestError quando device foi revogado', async () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(tenantId),
      name: 'Revoked',
      deviceKind: 'KIOSK_PUBLIC',
    });
    device.pair('hash', 'label', 'user');
    device.revoke('user', 'motivo');
    await repo.create(device);

    await expect(
      sut.execute({
        tenantId,
        deviceId: device.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
