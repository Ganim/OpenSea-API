import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { WeakPinError } from '@/@errors/use-cases/weak-pin-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';

import { SetPunchPinUseCase, WEAK_PINS_BLOCKLIST } from './set-punch-pin';

describe('SetPunchPinUseCase', () => {
  let repo: InMemoryEmployeesRepository;
  let sut: SetPunchPinUseCase;
  const tenantId = new UniqueEntityID().toString();

  beforeEach(() => {
    repo = new InMemoryEmployeesRepository();
    sut = new SetPunchPinUseCase(repo);
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

  it('rejects PINs that are not exactly 6 digits (too short)', async () => {
    const emp = await seedEmployee();
    await expect(
      sut.execute({
        tenantId,
        employeeId: emp.id.toString(),
        pin: '12345',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects PINs that contain non-digit characters', async () => {
    const emp = await seedEmployee();
    await expect(
      sut.execute({
        tenantId,
        employeeId: emp.id.toString(),
        pin: '12a456',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects weak PIN `111111` with WeakPinError', async () => {
    const emp = await seedEmployee();
    await expect(
      sut.execute({
        tenantId,
        employeeId: emp.id.toString(),
        pin: '111111',
      }),
    ).rejects.toBeInstanceOf(WeakPinError);
    // PIN must NOT have been persisted.
    expect(emp.punchPinHash).toBeNull();
  });

  it('rejects weak PIN `123456` with WeakPinError', async () => {
    const emp = await seedEmployee();
    await expect(
      sut.execute({
        tenantId,
        employeeId: emp.id.toString(),
        pin: '123456',
      }),
    ).rejects.toBeInstanceOf(WeakPinError);
  });

  it('blocks all 11 WEAK_PINS_BLOCKLIST entries', () => {
    // Sanity: the explicit set matches the plan spec literally.
    expect(WEAK_PINS_BLOCKLIST.size).toBe(11);
    expect(WEAK_PINS_BLOCKLIST.has('000000')).toBe(true);
    expect(WEAK_PINS_BLOCKLIST.has('999999')).toBe(true);
    expect(WEAK_PINS_BLOCKLIST.has('123456')).toBe(true);
    expect(WEAK_PINS_BLOCKLIST.has('735194')).toBe(false);
  });

  it('accepts a strong PIN, persists the bcrypt hash and clears any prior lockout', async () => {
    const emp = await seedEmployee();
    // Seed some pre-existing lockout state to ensure set-pin resets it.
    await repo.updatePinLockState(emp.id.toString(), tenantId, {
      failedAttempts: 3,
      lockedUntil: new Date('2099-01-01T00:00:00Z'),
      lastFailedAt: new Date('2099-01-01T00:00:00Z'),
    });

    const res = await sut.execute({
      tenantId,
      employeeId: emp.id.toString(),
      pin: '735194',
    });

    expect(typeof res.setAt).toBe('string');
    expect(Number.isNaN(Date.parse(res.setAt))).toBe(false);
    expect(emp.punchPinHash).toBeTruthy();
    expect(emp.punchPinHash).not.toBe('735194'); // NOT stored in plaintext
    expect(emp.punchPinSetAt).toBeInstanceOf(Date);
    // Lockout state must have been cleared.
    expect(emp.punchPinFailedAttempts).toBe(0);
    expect(emp.punchPinLockedUntil).toBeNull();
    expect(emp.punchPinLastFailedAt).toBeNull();
  });

  it('persists a bcrypt hash verifiable via bcrypt.compare', async () => {
    const emp = await seedEmployee();
    await sut.execute({
      tenantId,
      employeeId: emp.id.toString(),
      pin: '735194',
    });
    const ok = await bcrypt.compare('735194', emp.punchPinHash ?? '');
    expect(ok).toBe(true);
    const wrong = await bcrypt.compare('000000', emp.punchPinHash ?? '');
    expect(wrong).toBe(false);
  });

  it('throws ResourceNotFoundError when the employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: '00000000-0000-0000-0000-000000000000',
        pin: '735194',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('throws ResourceNotFoundError for cross-tenant set-pin (isolation)', async () => {
    const emp = await seedEmployee();
    await expect(
      sut.execute({
        tenantId: new UniqueEntityID().toString(),
        employeeId: emp.id.toString(),
        pin: '735194',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
