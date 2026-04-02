import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CipaMember } from '@/entities/hr/cipa-member';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { describe, expect, it } from 'vitest';
import { checkEmploymentStability } from './check-employment-stability';

function makeEmployee(
  overrides: Partial<Parameters<typeof Employee.create>[0]> = {},
): Employee {
  return Employee.create({
    tenantId: new UniqueEntityID('tenant-1'),
    registrationNumber: '001',
    fullName: 'Maria Silva',
    cpf: CPF.create('52998224725'),
    hireDate: new Date('2024-01-15'),
    status: EmployeeStatus.ACTIVE(),
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
    country: 'BR',
    pcd: false,
    metadata: {},
    pendingIssues: [],
    ...overrides,
  });
}

function makeCipaMember(
  overrides: Partial<Parameters<typeof CipaMember.create>[0]> = {},
): CipaMember {
  return CipaMember.create({
    tenantId: new UniqueEntityID('tenant-1'),
    mandateId: new UniqueEntityID('mandate-1'),
    employeeId: new UniqueEntityID('emp-1'),
    role: 'MEMBRO_TITULAR',
    type: 'EMPREGADO',
    isStable: true,
    stableUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    ...overrides,
  });
}

describe('checkEmploymentStability', () => {
  it('should return not stable for a regular employee', () => {
    const employee = makeEmployee();
    const result = checkEmploymentStability(employee);
    expect(result.isStable).toBe(false);
    expect(result.reason).toBeUndefined();
  });

  it('should detect pregnancy stability when isPregnant is true', () => {
    const employee = makeEmployee({ isPregnant: true });
    const result = checkEmploymentStability(employee);
    expect(result.isStable).toBe(true);
    expect(result.reason).toContain('Gestante');
  });

  it('should detect pregnancy stability with childBirthDate within 5 months', () => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const employee = makeEmployee({ childBirthDate: twoMonthsAgo });
    const result = checkEmploymentStability(employee);
    expect(result.isStable).toBe(true);
    expect(result.reason).toContain('gestante');
    expect(result.stableUntil).toBeDefined();
  });

  it('should not be stable if childBirthDate is more than 5 months ago', () => {
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);
    const employee = makeEmployee({ childBirthDate: sevenMonthsAgo });
    const result = checkEmploymentStability(employee);
    expect(result.isStable).toBe(false);
  });

  it('should detect work accident stability from metadata', () => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const employee = makeEmployee({
      metadata: {
        workAccidentReturnDate: threeMonthsAgo.toISOString(),
      },
    });
    const result = checkEmploymentStability(employee);
    expect(result.isStable).toBe(true);
    expect(result.reason).toContain('acidentária');
    expect(result.stableUntil).toBeDefined();
  });

  it('should not be stable if work accident return was over 12 months ago', () => {
    const fourteenMonthsAgo = new Date();
    fourteenMonthsAgo.setMonth(fourteenMonthsAgo.getMonth() - 14);
    const employee = makeEmployee({
      metadata: {
        workAccidentReturnDate: fourteenMonthsAgo.toISOString(),
      },
    });
    const result = checkEmploymentStability(employee);
    expect(result.isStable).toBe(false);
  });

  it('should detect CIPA stability from cipa members list', () => {
    const employee = makeEmployee();
    const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    const cipaMembers = [makeCipaMember({ stableUntil: futureDate })];
    const result = checkEmploymentStability(employee, cipaMembers);
    expect(result.isStable).toBe(true);
    expect(result.reason).toContain('CIPA');
    expect(result.stableUntil).toEqual(futureDate);
  });

  it('should not be stable from CIPA if stableUntil is in the past', () => {
    const employee = makeEmployee();
    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const cipaMembers = [makeCipaMember({ stableUntil: pastDate })];
    const result = checkEmploymentStability(employee, cipaMembers);
    expect(result.isStable).toBe(false);
  });

  it('should detect CIPA stability from metadata (legacy fallback)', () => {
    const futureEnd = new Date();
    futureEnd.setMonth(futureEnd.getMonth() + 6);
    const employee = makeEmployee({
      metadata: { cipaTermEnd: futureEnd.toISOString() },
    });
    const result = checkEmploymentStability(employee);
    expect(result.isStable).toBe(true);
    expect(result.reason).toContain('CIPA');
  });

  it('should prioritize pregnancy stability over other types', () => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const employee = makeEmployee({
      isPregnant: true,
      metadata: {
        workAccidentReturnDate: threeMonthsAgo.toISOString(),
      },
    });
    const result = checkEmploymentStability(employee);
    expect(result.isStable).toBe(true);
    expect(result.reason).toContain('Gestante');
  });

  it('should pick the latest stableUntil among multiple CIPA memberships', () => {
    const employee = makeEmployee();
    const futureDate1 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const futureDate2 = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const cipaMembers = [
      makeCipaMember({ stableUntil: futureDate1 }),
      makeCipaMember({ stableUntil: futureDate2 }),
    ];
    const result = checkEmploymentStability(employee, cipaMembers);
    expect(result.isStable).toBe(true);
    expect(result.stableUntil).toEqual(futureDate2);
  });
});
