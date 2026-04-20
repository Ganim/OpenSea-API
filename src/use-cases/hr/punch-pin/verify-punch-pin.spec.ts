import bcrypt from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PinInvalidError } from '@/@errors/use-cases/pin-invalid-error';
import { PinLockedError } from '@/@errors/use-cases/pin-locked-error';
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

import {
  LOCKOUT_MINUTES,
  MAX_ATTEMPTS,
  VerifyPunchPinUseCase,
} from './verify-punch-pin';

const publishMock = vi.fn();

vi.mock('@/lib/events/typed-event-bus', () => ({
  getTypedEventBus: () => ({
    publish: publishMock,
  }),
}));

describe('VerifyPunchPinUseCase', () => {
  let repo: InMemoryEmployeesRepository;
  let sut: VerifyPunchPinUseCase;
  const tenantId = new UniqueEntityID().toString();

  beforeEach(() => {
    publishMock.mockClear();
    repo = new InMemoryEmployeesRepository();
    sut = new VerifyPunchPinUseCase(repo);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function seedEmployeeWithPin(pin = '735194') {
    const employee = await repo.create({
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
    // bcrypt synchronously-equivalent — cost 10 is slow but required
    // so compare() takes the real code-path under test.
    const hash = await bcrypt.hash(pin, 10);
    await repo.updatePunchPin(
      employee.id.toString(),
      tenantId,
      hash,
      new Date(),
    );
    return employee;
  }

  async function seedEmployeeWithoutPin() {
    return repo.create({
      tenantId,
      registrationNumber: `EMP-${Math.random().toString(36).slice(2, 8)}`,
      fullName: 'Maria Sem PIN',
      cpf: CPF.create('12345678909'),
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 40,
      country: 'Brasil',
    });
  }

  it('returns { valid: true, employee } and clears lockout state on correct PIN', async () => {
    const emp = await seedEmployeeWithPin('735194');
    // Pre-seed a partial failure state — a successful verify must reset it.
    await repo.updatePinLockState(emp.id.toString(), tenantId, {
      failedAttempts: 2,
      lockedUntil: null,
      lastFailedAt: new Date(),
    });

    const res = await sut.execute({
      tenantId,
      employeeId: emp.id.toString(),
      pin: '735194',
    });

    expect(res.valid).toBe(true);
    expect(res.employee.id.equals(emp.id)).toBe(true);
    expect(emp.punchPinFailedAttempts).toBe(0);
    expect(emp.punchPinLockedUntil).toBeNull();
    expect(emp.punchPinLastFailedAt).toBeNull();
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('throws PinInvalidError with attemptsRemaining=4 on the first wrong PIN', async () => {
    const emp = await seedEmployeeWithPin('735194');

    try {
      await sut.execute({
        tenantId,
        employeeId: emp.id.toString(),
        pin: '000123',
      });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PinInvalidError);
      expect((error as PinInvalidError).attemptsRemaining).toBe(4);
    }

    expect(emp.punchPinFailedAttempts).toBe(1);
    expect(emp.punchPinLockedUntil).toBeNull();
    expect(emp.punchPinLastFailedAt).toBeInstanceOf(Date);
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('transitions to locked on the 5th consecutive wrong PIN; publishes PIN_LOCKED exactly once', async () => {
    const emp = await seedEmployeeWithPin('735194');

    // 4 failed attempts — still unlocked, still throwing PinInvalidError.
    for (let i = 1; i <= 4; i++) {
      await expect(
        sut.execute({
          tenantId,
          employeeId: emp.id.toString(),
          pin: '000123',
        }),
      ).rejects.toBeInstanceOf(PinInvalidError);
    }
    expect(emp.punchPinFailedAttempts).toBe(4);
    expect(emp.punchPinLockedUntil).toBeNull();
    expect(publishMock).not.toHaveBeenCalled();

    // 5th attempt — transitions to locked.
    const before = Date.now();
    await expect(
      sut.execute({
        tenantId,
        employeeId: emp.id.toString(),
        pin: '000123',
      }),
    ).rejects.toBeInstanceOf(PinLockedError);
    const after = Date.now();

    // Counter resets to 0 at the moment of lockout, lockedUntil = now+15min.
    expect(emp.punchPinFailedAttempts).toBe(0);
    expect(emp.punchPinLockedUntil).toBeInstanceOf(Date);
    const lockMs = emp.punchPinLockedUntil!.getTime();
    expect(lockMs).toBeGreaterThanOrEqual(
      before + LOCKOUT_MINUTES * 60 * 1000 - 1,
    );
    expect(lockMs).toBeLessThanOrEqual(after + LOCKOUT_MINUTES * 60 * 1000 + 1);

    // PIN_LOCKED event fired exactly once.
    expect(publishMock).toHaveBeenCalledTimes(1);
    const publishedArg = publishMock.mock.calls[0][0];
    expect(publishedArg.type).toBe(PUNCH_EVENTS.PIN_LOCKED);
    expect(publishedArg.tenantId).toBe(tenantId);
    expect(publishedArg.data).toMatchObject({
      employeeId: emp.id.toString(),
      tenantId,
      employeeName: 'João Silva',
      failedAttempts: MAX_ATTEMPTS,
    });
    expect(publishedArg.data.lockedUntil).toEqual(expect.any(String));
  });

  it('throws PinLockedError without incrementing the counter while already locked', async () => {
    const emp = await seedEmployeeWithPin('735194');
    const future = new Date(Date.now() + 10 * 60 * 1000);
    await repo.updatePinLockState(emp.id.toString(), tenantId, {
      failedAttempts: 0,
      lockedUntil: future,
      lastFailedAt: new Date(),
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: emp.id.toString(),
        pin: '735194', // even correct PIN is rejected while locked
      }),
    ).rejects.toBeInstanceOf(PinLockedError);

    // Counter still 0, lockedUntil unchanged.
    expect(emp.punchPinFailedAttempts).toBe(0);
    expect(emp.punchPinLockedUntil?.getTime()).toBe(future.getTime());
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('after lockedUntil expires, correct PIN succeeds and clears the lock state', async () => {
    const emp = await seedEmployeeWithPin('735194');
    // Put the lock in the past.
    const past = new Date(Date.now() - 60 * 1000);
    await repo.updatePinLockState(emp.id.toString(), tenantId, {
      failedAttempts: 0,
      lockedUntil: past,
      lastFailedAt: past,
    });

    const res = await sut.execute({
      tenantId,
      employeeId: emp.id.toString(),
      pin: '735194',
    });

    expect(res.valid).toBe(true);
    expect(emp.punchPinLockedUntil).toBeNull();
    expect(emp.punchPinFailedAttempts).toBe(0);
    expect(emp.punchPinLastFailedAt).toBeNull();
  });

  it('auto-resets the counter when lastFailedAt is older than 1h', async () => {
    const emp = await seedEmployeeWithPin('735194');
    // Seed as if the employee had failed 4 times more than 1h ago.
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await repo.updatePinLockState(emp.id.toString(), tenantId, {
      failedAttempts: 4,
      lockedUntil: null,
      lastFailedAt: twoHoursAgo,
    });

    // A single wrong attempt now must NOT lock (stale counter was discarded);
    // it records a fresh failure with attemptsRemaining=4 (meaning count=1).
    try {
      await sut.execute({
        tenantId,
        employeeId: emp.id.toString(),
        pin: '000123',
      });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PinInvalidError);
      expect((error as PinInvalidError).attemptsRemaining).toBe(4);
    }
    expect(emp.punchPinFailedAttempts).toBe(1);
    expect(emp.punchPinLockedUntil).toBeNull();
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('throws PinInvalidError("PIN não configurado") when employee has no hash', async () => {
    const emp = await seedEmployeeWithoutPin();
    try {
      await sut.execute({
        tenantId,
        employeeId: emp.id.toString(),
        pin: '735194',
      });
      throw new Error('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PinInvalidError);
      expect((error as PinInvalidError).attemptsRemaining).toBeNull();
      expect((error as PinInvalidError).message).toContain(
        'PIN não configurado',
      );
    }
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('throws ResourceNotFoundError when employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: '00000000-0000-0000-0000-000000000000',
        pin: '735194',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('throws ResourceNotFoundError for cross-tenant verify (isolation)', async () => {
    const emp = await seedEmployeeWithPin('735194');
    await expect(
      sut.execute({
        tenantId: new UniqueEntityID().toString(),
        employeeId: emp.id.toString(),
        pin: '735194',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('does not double-publish PIN_LOCKED when caller retries after a lock', async () => {
    const emp = await seedEmployeeWithPin('735194');

    // 5 wrongs → lock + 1 publish.
    for (let i = 1; i <= 5; i++) {
      await expect(
        sut.execute({
          tenantId,
          employeeId: emp.id.toString(),
          pin: '000123',
        }),
      ).rejects.toBeDefined();
    }
    expect(publishMock).toHaveBeenCalledTimes(1);

    // A further attempt while locked → PinLockedError; must NOT publish again.
    await expect(
      sut.execute({
        tenantId,
        employeeId: emp.id.toString(),
        pin: '000123',
      }),
    ).rejects.toBeInstanceOf(PinLockedError);
    expect(publishMock).toHaveBeenCalledTimes(1);
  });

  it('event publish failure does NOT undo the persisted lockout', async () => {
    const emp = await seedEmployeeWithPin('735194');
    publishMock.mockRejectedValueOnce(new Error('bus down'));

    // Pre-increment to attempts=4 so the next wrong attempt triggers lockout.
    await repo.updatePinLockState(emp.id.toString(), tenantId, {
      failedAttempts: 4,
      lockedUntil: null,
      lastFailedAt: new Date(),
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: emp.id.toString(),
        pin: '000123',
      }),
    ).rejects.toBeInstanceOf(PinLockedError);

    // Even though publishing threw, the persisted state must reflect the lock.
    expect(emp.punchPinLockedUntil).toBeInstanceOf(Date);
    expect(emp.punchPinFailedAttempts).toBe(0);
  });
});
