import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchDevice } from '@/entities/hr/punch-device';
import { getCurrentPairingCode } from '@/lib/pos-pairing-code';
import { InMemoryPunchDevicesRepository } from '@/repositories/hr/in-memory/in-memory-punch-devices-repository';
import { PairPunchDeviceUseCase } from './pair-punch-device';

let repo: InMemoryPunchDevicesRepository;
let sut: PairPunchDeviceUseCase;
let tenantId: string;

describe('PairPunchDeviceUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryPunchDevicesRepository();
    sut = new PairPunchDeviceUseCase(repo);
    tenantId = new UniqueEntityID().toString();
  });

  async function seedDevice() {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(tenantId),
      name: 'Kiosk',
      deviceKind: 'KIOSK_PUBLIC',
    });
    await repo.create(device);
    return device;
  }

  it('retorna deviceToken de 64 hex chars e persiste SHA-256 no hash', async () => {
    const device = await seedDevice();
    const { code } = getCurrentPairingCode(device.pairingSecret);

    const result = await sut.execute({
      tenantId,
      deviceId: device.id.toString(),
      pairingCode: code,
      hostname: 'kiosk-recep-pc',
      pairedByUserId: 'admin-01',
    });

    expect(result.deviceToken).toMatch(/^[0-9a-f]{64}$/);
    expect(result.deviceId).toBe(device.id.toString());
    expect(result.deviceName).toBe('Kiosk');

    const expectedHash = createHash('sha256')
      .update(result.deviceToken)
      .digest('hex');
    expect(repo.items[0].deviceTokenHash).toBe(expectedHash);
    expect(repo.items[0].isPaired).toBe(true);
    expect(repo.items[0].pairedByUserId).toBe('admin-01');
    expect(repo.items[0].deviceLabel).toBe('kiosk-recep-pc');
  });

  it('aceita pairingCode em lowercase (normaliza para uppercase)', async () => {
    const device = await seedDevice();
    const { code } = getCurrentPairingCode(device.pairingSecret);

    const result = await sut.execute({
      tenantId,
      deviceId: device.id.toString(),
      pairingCode: code.toLowerCase(),
      hostname: 'host',
      pairedByUserId: 'admin-01',
    });

    expect(result.deviceToken).toHaveLength(64);
  });

  it('lança ResourceNotFoundError quando device não existe', async () => {
    await expect(
      sut.execute({
        tenantId,
        deviceId: new UniqueEntityID().toString(),
        pairingCode: 'ABC123',
        hostname: 'host',
        pairedByUserId: 'admin-01',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('lança ResourceNotFoundError quando device é de outro tenant', async () => {
    const otherTenantDevice = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'Other',
      deviceKind: 'KIOSK_PUBLIC',
    });
    await repo.create(otherTenantDevice);

    await expect(
      sut.execute({
        tenantId,
        deviceId: otherTenantDevice.id.toString(),
        pairingCode: 'ABC123',
        hostname: 'host',
        pairedByUserId: 'admin-01',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('lança BadRequestError quando device já está pareado', async () => {
    const device = await seedDevice();
    device.pair('hash', 'label', 'u');
    await repo.save(device);

    await expect(
      sut.execute({
        tenantId,
        deviceId: device.id.toString(),
        pairingCode: 'ABC123',
        hostname: 'host',
        pairedByUserId: 'admin-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lança BadRequestError quando device foi revogado', async () => {
    const device = await seedDevice();
    device.pair('hash', 'label', 'u');
    device.revoke('u', 'motivo');
    await repo.save(device);

    await expect(
      sut.execute({
        tenantId,
        deviceId: device.id.toString(),
        pairingCode: 'ABC123',
        hostname: 'host',
        pairedByUserId: 'admin-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lança BadRequestError quando código TOTP inválido', async () => {
    const device = await seedDevice();

    await expect(
      sut.execute({
        tenantId,
        deviceId: device.id.toString(),
        pairingCode: 'ZZZZZZ',
        hostname: 'host',
        pairedByUserId: 'admin-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('trunca hostname em 128 chars ao criar deviceLabel', async () => {
    const device = await seedDevice();
    const { code } = getCurrentPairingCode(device.pairingSecret);

    const longHostname = 'a'.repeat(200);
    await sut.execute({
      tenantId,
      deviceId: device.id.toString(),
      pairingCode: code,
      hostname: longHostname,
      pairedByUserId: 'admin-01',
    });

    expect(repo.items[0].deviceLabel).toHaveLength(128);
  });
});
