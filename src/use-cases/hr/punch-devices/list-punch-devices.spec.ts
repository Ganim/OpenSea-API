import { beforeEach, describe, expect, it } from 'vitest';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchDevice } from '@/entities/hr/punch-device';
import { InMemoryPunchDevicesRepository } from '@/repositories/hr/in-memory/in-memory-punch-devices-repository';
import { ListPunchDevicesUseCase } from './list-punch-devices';

let repo: InMemoryPunchDevicesRepository;
let sut: ListPunchDevicesUseCase;
let tenantId: string;

describe('ListPunchDevicesUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryPunchDevicesRepository();
    sut = new ListPunchDevicesUseCase(repo);
    tenantId = new UniqueEntityID().toString();
  });

  it('retorna items mapeados para DTO + total + page + pageSize', async () => {
    await repo.create(
      PunchDevice.create({
        tenantId: new UniqueEntityID(tenantId),
        name: 'D1',
        deviceKind: 'KIOSK_PUBLIC',
      }),
    );

    const result = await sut.execute({ tenantId });

    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('D1');
  });

  it('DTO não contém pairingSecret nem deviceTokenHash (Pitfall 5)', async () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(tenantId),
      name: 'Paired',
      deviceKind: 'KIOSK_PUBLIC',
    });
    device.pair('hash-secret', 'label', 'user');
    await repo.create(device);

    const result = await sut.execute({ tenantId });
    const json = JSON.stringify(result);

    expect(json).not.toContain('pairingSecret');
    expect(json).not.toContain('deviceTokenHash');
    expect(json).not.toContain('revokedReason');
  });

  it('filtra por deviceKind', async () => {
    await repo.create(
      PunchDevice.create({
        tenantId: new UniqueEntityID(tenantId),
        name: 'K',
        deviceKind: 'KIOSK_PUBLIC',
      }),
    );
    await repo.create(
      PunchDevice.create({
        tenantId: new UniqueEntityID(tenantId),
        name: 'P',
        deviceKind: 'PWA_PERSONAL',
      }),
    );

    const result = await sut.execute({ tenantId, deviceKind: 'PWA_PERSONAL' });

    expect(result.total).toBe(1);
    expect(result.items[0].deviceKind).toBe('PWA_PERSONAL');
  });

  it('paginação por page/pageSize', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.create(
        PunchDevice.create({
          tenantId: new UniqueEntityID(tenantId),
          name: `D-${i}`,
          deviceKind: 'KIOSK_PUBLIC',
        }),
      );
    }

    const result = await sut.execute({ tenantId, page: 2, pageSize: 2 });

    expect(result.total).toBe(5);
    expect(result.items).toHaveLength(2);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(2);
  });

  it('isola tenants (não retorna devices de outros)', async () => {
    const other = new UniqueEntityID().toString();

    await repo.create(
      PunchDevice.create({
        tenantId: new UniqueEntityID(tenantId),
        name: 'mine',
        deviceKind: 'KIOSK_PUBLIC',
      }),
    );
    await repo.create(
      PunchDevice.create({
        tenantId: new UniqueEntityID(other),
        name: 'theirs',
        deviceKind: 'KIOSK_PUBLIC',
      }),
    );

    const result = await sut.execute({ tenantId });

    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('mine');
  });
});
