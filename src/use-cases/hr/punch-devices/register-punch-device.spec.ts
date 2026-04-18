import { beforeEach, describe, expect, it } from 'vitest';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPunchDevicesRepository } from '@/repositories/hr/in-memory/in-memory-punch-devices-repository';
import { RegisterPunchDeviceUseCase } from './register-punch-device';

let repo: InMemoryPunchDevicesRepository;
let sut: RegisterPunchDeviceUseCase;

describe('RegisterPunchDeviceUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryPunchDevicesRepository();
    sut = new RegisterPunchDeviceUseCase(repo);
  });

  it('cria device com pairingSecret 64 hex chars e retorna deviceId', async () => {
    const tenantId = new UniqueEntityID().toString();

    const result = await sut.execute({
      tenantId,
      name: 'Kiosk Recepção',
      deviceKind: 'KIOSK_PUBLIC',
    });

    expect(result.deviceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(result.pairingSecret).toHaveLength(64);
    expect(repo.items).toHaveLength(1);
    expect(repo.items[0].name).toBe('Kiosk Recepção');
    expect(repo.items[0].tenantId.toString()).toBe(tenantId);
  });

  it('persiste allowlist de employees e departments', async () => {
    const tenantId = new UniqueEntityID().toString();

    await sut.execute({
      tenantId,
      name: 'Kiosk Com Allowlist',
      deviceKind: 'KIOSK_PUBLIC',
      allowedEmployeeIds: ['emp-1', 'emp-2'],
      allowedDepartmentIds: ['dep-1'],
    });

    expect(repo.allowedEmployees).toHaveLength(2);
    expect(repo.allowedDepartments).toHaveLength(1);
  });

  it('aceita geofenceZoneId opcional', async () => {
    const tenantId = new UniqueEntityID().toString();
    const zoneId = new UniqueEntityID().toString();

    await sut.execute({
      tenantId,
      name: 'Com Geofence',
      deviceKind: 'KIOSK_PUBLIC',
      geofenceZoneId: zoneId,
    });

    expect(repo.items[0].geofenceZoneId?.toString()).toBe(zoneId);
  });

  it('faz trim no name', async () => {
    const tenantId = new UniqueEntityID().toString();

    await sut.execute({
      tenantId,
      name: '   Espaços Sobrando   ',
      deviceKind: 'KIOSK_PUBLIC',
    });

    expect(repo.items[0].name).toBe('Espaços Sobrando');
  });

  it('lança BadRequestError quando name vazio', async () => {
    await expect(
      sut.execute({
        tenantId: new UniqueEntityID().toString(),
        name: '   ',
        deviceKind: 'KIOSK_PUBLIC',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lança BadRequestError quando name > 128 chars', async () => {
    await expect(
      sut.execute({
        tenantId: new UniqueEntityID().toString(),
        name: 'x'.repeat(129),
        deviceKind: 'KIOSK_PUBLIC',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lança BadRequestError quando deviceKind inválido', async () => {
    await expect(
      sut.execute({
        tenantId: new UniqueEntityID().toString(),
        name: 'Device',
        // @ts-expect-error — testa cast inválido
        deviceKind: 'INVALID_KIND',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
