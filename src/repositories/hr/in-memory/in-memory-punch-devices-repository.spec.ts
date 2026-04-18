import { describe, expect, it } from 'vitest';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchDevice } from '@/entities/hr/punch-device';
import { InMemoryPunchDevicesRepository } from './in-memory-punch-devices-repository';

function makeDevice(
  overrides: Partial<Parameters<typeof PunchDevice.create>[0]> = {},
) {
  return PunchDevice.create({
    tenantId: overrides.tenantId ?? new UniqueEntityID(),
    name: overrides.name ?? 'Device',
    deviceKind: overrides.deviceKind ?? 'KIOSK_PUBLIC',
    ...overrides,
  });
}

describe('InMemoryPunchDevicesRepository', () => {
  describe('create', () => {
    it('push o device na lista items', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const device = makeDevice();

      await repo.create(device);

      expect(repo.items).toHaveLength(1);
      expect(repo.items[0].id.toString()).toBe(device.id.toString());
    });
  });

  describe('createWithAllowlist', () => {
    it('persiste device + employees + departments atomicamente', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const device = makeDevice();

      await repo.createWithAllowlist({
        device,
        allowedEmployeeIds: ['emp-1', 'emp-2'],
        allowedDepartmentIds: ['dep-1'],
      });

      expect(repo.items).toHaveLength(1);
      expect(repo.allowedEmployees).toHaveLength(2);
      expect(repo.allowedDepartments).toHaveLength(1);
      expect(repo.allowedEmployees[0]).toEqual({
        deviceId: device.id.toString(),
        employeeId: 'emp-1',
      });
      expect(repo.allowedDepartments[0]).toEqual({
        deviceId: device.id.toString(),
        departmentId: 'dep-1',
      });
    });

    it('aceita listas vazias sem erro', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const device = makeDevice();

      await repo.createWithAllowlist({ device });

      expect(repo.items).toHaveLength(1);
      expect(repo.allowedEmployees).toHaveLength(0);
      expect(repo.allowedDepartments).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('retorna device apenas se tenantId bate E deletedAt é undefined', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const tenantA = new UniqueEntityID();
      const tenantB = new UniqueEntityID();
      const device = makeDevice({ tenantId: tenantA });
      await repo.create(device);

      // Tenant correto
      const found = await repo.findById(device.id, tenantA.toString());
      expect(found).not.toBeNull();

      // Tenant errado
      const wrongTenant = await repo.findById(device.id, tenantB.toString());
      expect(wrongTenant).toBeNull();

      // Após soft-delete
      device.deletedAt = new Date();
      await repo.save(device);
      const deleted = await repo.findById(device.id, tenantA.toString());
      expect(deleted).toBeNull();
    });
  });

  describe('findByDeviceTokenHash', () => {
    it('retorna device apenas se !deletedAt E !revokedAt', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const device = makeDevice();
      device.pair('hash-abc', 'label', 'user-01');
      await repo.create(device);

      // Ativo
      const active = await repo.findByDeviceTokenHash('hash-abc');
      expect(active).not.toBeNull();

      // Revogado
      device.revoke('user-99', 'motivo');
      await repo.save(device);
      const revoked = await repo.findByDeviceTokenHash('hash-abc');
      expect(revoked).toBeNull();

      // Repair + soft-delete
      device.pair('hash-xyz', 'label2', 'user-01');
      device.deletedAt = new Date();
      await repo.save(device);
      const deleted = await repo.findByDeviceTokenHash('hash-xyz');
      expect(deleted).toBeNull();
    });
  });

  describe('findAllUnpairedWithPairingSecret', () => {
    it('retorna apenas devices !deviceTokenHash && !revokedAt && !deletedAt do tenant', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const tenantA = new UniqueEntityID();
      const tenantB = new UniqueEntityID();

      const unpairedA = makeDevice({ tenantId: tenantA, name: 'A-unpaired' });
      const pairedA = makeDevice({ tenantId: tenantA, name: 'A-paired' });
      pairedA.pair('hash', 'label', 'user');
      const deletedA = makeDevice({ tenantId: tenantA, name: 'A-deleted' });
      deletedA.deletedAt = new Date();
      const revokedA = makeDevice({ tenantId: tenantA, name: 'A-revoked' });
      revokedA.pair('h2', 'l', 'u');
      revokedA.revoke('u', 'r');
      const unpairedB = makeDevice({ tenantId: tenantB, name: 'B-unpaired' });

      await repo.create(unpairedA);
      await repo.create(pairedA);
      await repo.create(deletedA);
      await repo.create(revokedA);
      await repo.create(unpairedB);

      const result = await repo.findAllUnpairedWithPairingSecret(
        tenantA.toString(),
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('A-unpaired');
    });

    it('filtra para o deviceId específico quando fornecido', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const tenant = new UniqueEntityID();

      const d1 = makeDevice({ tenantId: tenant, name: 'D1' });
      const d2 = makeDevice({ tenantId: tenant, name: 'D2' });
      await repo.create(d1);
      await repo.create(d2);

      const result = await repo.findAllUnpairedWithPairingSecret(
        tenant.toString(),
        d1.id,
      );
      expect(result).toHaveLength(1);
      expect(result[0].id.toString()).toBe(d1.id.toString());
    });
  });

  describe('findManyByTenantId', () => {
    it('retorna items paginados + total do tenant (sem revogados por default)', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const tenantA = new UniqueEntityID();
      const tenantB = new UniqueEntityID();

      for (let i = 0; i < 3; i++) {
        await repo.create(makeDevice({ tenantId: tenantA, name: `A-${i}` }));
      }
      await repo.create(makeDevice({ tenantId: tenantB, name: 'B-0' }));

      const result = await repo.findManyByTenantId(tenantA.toString());

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('filtra por deviceKind', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const tenant = new UniqueEntityID();

      await repo.create(
        makeDevice({ tenantId: tenant, deviceKind: 'KIOSK_PUBLIC' }),
      );
      await repo.create(
        makeDevice({ tenantId: tenant, deviceKind: 'PWA_PERSONAL' }),
      );
      await repo.create(
        makeDevice({ tenantId: tenant, deviceKind: 'PWA_PERSONAL' }),
      );

      const result = await repo.findManyByTenantId(tenant.toString(), {
        deviceKind: 'PWA_PERSONAL',
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('filtra por status', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const tenant = new UniqueEntityID();

      const online = makeDevice({ tenantId: tenant });
      online.recordHeartbeat();
      await repo.create(online);
      await repo.create(makeDevice({ tenantId: tenant }));

      const result = await repo.findManyByTenantId(tenant.toString(), {
        status: 'ONLINE',
      });

      expect(result.items).toHaveLength(1);
    });

    it('exclui revogados por default e inclui com includeRevoked=true', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const tenant = new UniqueEntityID();

      const active = makeDevice({ tenantId: tenant, name: 'active' });
      const revoked = makeDevice({ tenantId: tenant, name: 'revoked' });
      revoked.pair('h', 'l', 'u');
      revoked.revoke('u', 'r');

      await repo.create(active);
      await repo.create(revoked);

      const defaultResult = await repo.findManyByTenantId(tenant.toString());
      expect(defaultResult.items).toHaveLength(1);
      expect(defaultResult.items[0].name).toBe('active');

      const withRevoked = await repo.findManyByTenantId(tenant.toString(), {
        includeRevoked: true,
      });
      expect(withRevoked.items).toHaveLength(2);
    });

    it('aplica paginação (page/pageSize)', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const tenant = new UniqueEntityID();

      for (let i = 0; i < 5; i++) {
        await repo.create(makeDevice({ tenantId: tenant, name: `D-${i}` }));
      }

      const page1 = await repo.findManyByTenantId(tenant.toString(), {
        page: 1,
        pageSize: 2,
      });
      expect(page1.items).toHaveLength(2);
      expect(page1.total).toBe(5);

      const page3 = await repo.findManyByTenantId(tenant.toString(), {
        page: 3,
        pageSize: 2,
      });
      expect(page3.items).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('faz soft-delete marcando deletedAt', async () => {
      const repo = new InMemoryPunchDevicesRepository();
      const tenant = new UniqueEntityID();
      const device = makeDevice({ tenantId: tenant });
      await repo.create(device);

      await repo.delete(device.id, tenant.toString());

      expect(repo.items[0].deletedAt).toBeInstanceOf(Date);
      const found = await repo.findById(device.id, tenant.toString());
      expect(found).toBeNull();
    });
  });
});
