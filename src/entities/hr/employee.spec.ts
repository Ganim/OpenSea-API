import { describe, expect, it } from 'vitest';

import { UniqueEntityID } from '../domain/unique-entity-id';
import { Employee } from './employee';
import { ContractType, CPF, EmployeeStatus, WorkRegime } from './value-objects';

/**
 * Phase 5 / Plan 05-01 / Task 2 — Employee entity getters for kiosk badge QR
 * (D-15) and PIN fallback (D-08).
 *
 * Only covers the 7 new fields the plan adds. Pre-existing entity behaviour
 * is exercised by the use-case specs that build via makeEmployee().
 */
function buildBaseProps() {
  return {
    tenantId: new UniqueEntityID(),
    registrationNumber: 'EMP-PHASE5-TEST',
    fullName: 'Teste de Ponto',
    pcd: false,
    cpf: CPF.create('39053344705'),
    country: 'Brasil',
    hireDate: new Date('2024-01-01'),
    status: EmployeeStatus.ACTIVE(),
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
    metadata: {},
    pendingIssues: [] as string[],
  };
}

describe('Employee entity — Phase 5 kiosk badge + PIN fields (D-08, D-15)', () => {
  it('returns the 7 Phase 5 getters with the values supplied via props', () => {
    const setAt = new Date('2026-04-19T10:00:00Z');
    const lockedUntil = new Date('2026-04-19T10:15:00Z');
    const lastFailedAt = new Date('2026-04-19T09:55:00Z');

    const employee = Employee.create({
      ...buildBaseProps(),
      qrTokenHash: 'a'.repeat(64),
      qrTokenSetAt: setAt,
      punchPinHash: '$2a$10$abcdefghijklmnopqrstuv',
      punchPinSetAt: setAt,
      punchPinLockedUntil: lockedUntil,
      punchPinFailedAttempts: 3,
      punchPinLastFailedAt: lastFailedAt,
    });

    expect(employee.qrTokenHash).toBe('a'.repeat(64));
    expect(employee.qrTokenSetAt).toEqual(setAt);
    expect(employee.punchPinHash).toBe('$2a$10$abcdefghijklmnopqrstuv');
    expect(employee.punchPinSetAt).toEqual(setAt);
    expect(employee.punchPinLockedUntil).toEqual(lockedUntil);
    expect(employee.punchPinFailedAttempts).toBe(3);
    expect(employee.punchPinLastFailedAt).toEqual(lastFailedAt);
  });

  it('returns sensible defaults when Phase 5 props are absent', () => {
    const employee = Employee.create(buildBaseProps());

    expect(employee.qrTokenHash).toBeNull();
    expect(employee.qrTokenSetAt).toBeNull();
    expect(employee.punchPinHash).toBeNull();
    expect(employee.punchPinSetAt).toBeNull();
    expect(employee.punchPinLockedUntil).toBeNull();
    expect(employee.punchPinFailedAttempts).toBe(0);
    expect(employee.punchPinLastFailedAt).toBeNull();
  });

  it('coerces explicit null props to null/0 (Prisma → entity boundary)', () => {
    const employee = Employee.create({
      ...buildBaseProps(),
      qrTokenHash: null,
      qrTokenSetAt: null,
      punchPinHash: null,
      punchPinSetAt: null,
      punchPinLockedUntil: null,
      punchPinFailedAttempts: 0,
      punchPinLastFailedAt: null,
    });

    expect(employee.qrTokenHash).toBeNull();
    expect(employee.qrTokenSetAt).toBeNull();
    expect(employee.punchPinHash).toBeNull();
    expect(employee.punchPinSetAt).toBeNull();
    expect(employee.punchPinLockedUntil).toBeNull();
    expect(employee.punchPinFailedAttempts).toBe(0);
    expect(employee.punchPinLastFailedAt).toBeNull();
  });
});
