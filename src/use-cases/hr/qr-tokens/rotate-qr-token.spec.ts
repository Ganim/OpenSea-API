import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { PUNCH_EVENTS } from '@/lib/events/punch-events';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';

import { RotateQrTokenUseCase } from './rotate-qr-token';

const publishMock = vi.fn();

vi.mock('@/lib/events/typed-event-bus', () => ({
  getTypedEventBus: () => ({
    publish: publishMock,
  }),
}));

describe('RotateQrTokenUseCase', () => {
  let repo: InMemoryEmployeesRepository;
  let sut: RotateQrTokenUseCase;
  const tenantId = new UniqueEntityID().toString();

  beforeEach(() => {
    publishMock.mockClear();
    repo = new InMemoryEmployeesRepository();
    sut = new RotateQrTokenUseCase(repo);
  });

  async function seedEmployee() {
    return repo.create({
      tenantId,
      registrationNumber: `EMP-${Math.random().toString(36).slice(2, 8)}`,
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    });
  }

  it('generates a 32-byte token (64 hex chars) and persists its sha256 hash', async () => {
    const employee = await seedEmployee();

    const result = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
      rotatedByUserId: 'admin-01',
    });

    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(result.rotatedAt).toEqual(expect.any(String));
    // Parses as a valid ISO timestamp.
    expect(Number.isNaN(Date.parse(result.rotatedAt))).toBe(false);

    const expectedHash = createHash('sha256')
      .update(result.token)
      .digest('hex');
    expect(employee.qrTokenHash).toBe(expectedHash);
    expect(employee.qrTokenSetAt).toBeInstanceOf(Date);
  });

  it('invalidates the previous hash on a second rotation (old hash no longer resolves)', async () => {
    const employee = await seedEmployee();

    const first = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
      rotatedByUserId: 'admin-01',
    });
    const firstHash = createHash('sha256').update(first.token).digest('hex');

    const second = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
      rotatedByUserId: 'admin-01',
    });
    const secondHash = createHash('sha256').update(second.token).digest('hex');

    expect(firstHash).not.toBe(secondHash);
    expect(employee.qrTokenHash).toBe(secondHash);

    expect(await repo.findByQrTokenHash(firstHash, tenantId)).toBeNull();
    const found = await repo.findByQrTokenHash(secondHash, tenantId);
    expect(found?.id.equals(employee.id)).toBe(true);
  });

  it('publishes PUNCH_EVENTS.QR_ROTATED with the typed payload', async () => {
    const employee = await seedEmployee();

    await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
      rotatedByUserId: 'admin-01',
    });

    expect(publishMock).toHaveBeenCalledTimes(1);
    const publishedArg = publishMock.mock.calls[0][0];
    expect(publishedArg.type).toBe(PUNCH_EVENTS.QR_ROTATED);
    expect(publishedArg.tenantId).toBe(tenantId);
    expect(publishedArg.data).toMatchObject({
      employeeId: employee.id.toString(),
      tenantId,
      rotatedByUserId: 'admin-01',
    });
    expect(publishedArg.data.rotatedAt).toEqual(expect.any(String));
  });

  it('throws ResourceNotFoundError when employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: '00000000-0000-0000-0000-000000000000',
        rotatedByUserId: 'admin-01',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('throws ResourceNotFoundError when employee is on a different tenant', async () => {
    const employee = await seedEmployee();
    await expect(
      sut.execute({
        tenantId: new UniqueEntityID().toString(),
        employeeId: employee.id.toString(),
        rotatedByUserId: 'admin-01',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect(publishMock).not.toHaveBeenCalled();
  });
});
