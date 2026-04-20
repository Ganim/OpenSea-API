import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';

import { UnlockPunchPinUseCase } from './unlock-punch-pin';

describe('UnlockPunchPinUseCase', () => {
  let repo: InMemoryEmployeesRepository;
  let sut: UnlockPunchPinUseCase;
  const tenantId = new UniqueEntityID().toString();

  beforeEach(() => {
    repo = new InMemoryEmployeesRepository();
    sut = new UnlockPunchPinUseCase(repo);
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

  it('clears lockedUntil, failedAttempts and lastFailedAt on a locked employee', async () => {
    const emp = await seedEmployee();
    await repo.updatePinLockState(emp.id.toString(), tenantId, {
      failedAttempts: 5,
      lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
      lastFailedAt: new Date(),
    });

    const res = await sut.execute({
      tenantId,
      employeeId: emp.id.toString(),
    });

    expect(typeof res.unlockedAt).toBe('string');
    expect(Number.isNaN(Date.parse(res.unlockedAt))).toBe(false);
    expect(emp.punchPinLockedUntil).toBeNull();
    expect(emp.punchPinFailedAttempts).toBe(0);
    expect(emp.punchPinLastFailedAt).toBeNull();
  });

  it('is idempotent — second call on an already-unlocked employee succeeds', async () => {
    const emp = await seedEmployee();
    await sut.execute({ tenantId, employeeId: emp.id.toString() });
    // No-op second call. Must not throw.
    const res = await sut.execute({
      tenantId,
      employeeId: emp.id.toString(),
    });
    expect(typeof res.unlockedAt).toBe('string');
  });

  it('throws ResourceNotFoundError when employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: '00000000-0000-0000-0000-000000000000',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('throws ResourceNotFoundError for cross-tenant unlock (isolation)', async () => {
    const emp = await seedEmployee();
    await expect(
      sut.execute({
        tenantId: new UniqueEntityID().toString(),
        employeeId: emp.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
