import { describe, expect, it, vi } from 'vitest';

import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

import { createValidationContext } from '../__fixtures__/create-validation-context';
import { EmployeeActiveValidator } from './employee-active.validator';

function makeRepo(
  findById: EmployeesRepository['findById'],
): EmployeesRepository {
  // Partial stub — validator only touches findById. Casting through
  // `unknown` is the idiomatic way to narrow a full repo interface to
  // the single method under test without pretending to implement 20+
  // other methods that are irrelevant here.
  return { findById } as unknown as EmployeesRepository;
}

describe('EmployeeActiveValidator', () => {
  it('REJECTs with EMPLOYEE_NOT_FOUND when the repo returns null', async () => {
    const repo = makeRepo(vi.fn().mockResolvedValue(null));
    const validator = new EmployeeActiveValidator(repo);

    const decision = await validator.validate(createValidationContext());

    expect(decision).toEqual({
      outcome: 'REJECT',
      code: 'EMPLOYEE_NOT_FOUND',
      reason: expect.stringContaining('não encontrado'),
    });
  });

  it('REJECTs with EMPLOYEE_INACTIVE when employee.status.isActive() returns false', async () => {
    const repo = makeRepo(
      vi.fn().mockResolvedValue({
        status: { isActive: () => false },
      }),
    );
    const validator = new EmployeeActiveValidator(repo);

    const decision = await validator.validate(createValidationContext());

    expect(decision).toEqual({
      outcome: 'REJECT',
      code: 'EMPLOYEE_INACTIVE',
      reason: expect.stringContaining('inativo'),
    });
  });

  it('ACCEPTs when employee is active', async () => {
    const repo = makeRepo(
      vi.fn().mockResolvedValue({
        status: { isActive: () => true },
      }),
    );
    const validator = new EmployeeActiveValidator(repo);

    const decision = await validator.validate(createValidationContext());

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });
});
