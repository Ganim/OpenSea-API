import { describe, expect, it, vi } from 'vitest';

import type { ShiftAssignmentsRepository } from '@/repositories/hr/shift-assignments-repository';

import { createValidationContext } from '../__fixtures__/create-validation-context';
import { WorkScheduleValidator } from './work-schedule.validator';

function makeRepo(
  findActiveByEmployee: ShiftAssignmentsRepository['findActiveByEmployee'],
): ShiftAssignmentsRepository {
  return { findActiveByEmployee } as unknown as ShiftAssignmentsRepository;
}

describe('WorkScheduleValidator', () => {
  it('REJECTs with NO_WORK_SCHEDULE when the employee has no active shift assignment', async () => {
    const repo = makeRepo(vi.fn().mockResolvedValue(null));
    const validator = new WorkScheduleValidator(repo);

    const decision = await validator.validate(createValidationContext());

    expect(decision).toEqual({
      outcome: 'REJECT',
      code: 'NO_WORK_SCHEDULE',
      reason: expect.stringContaining('jornada'),
    });
  });

  it('ACCEPTs when the employee has an active shift assignment', async () => {
    const repo = makeRepo(
      vi.fn().mockResolvedValue({ id: 'assignment-1', isActive: true }),
    );
    const validator = new WorkScheduleValidator(repo);

    const decision = await validator.validate(createValidationContext());

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });

  it('passes tenantId and employeeId through to the repo', async () => {
    const spy = vi.fn().mockResolvedValue({ id: 'a' });
    const repo = makeRepo(spy);
    const validator = new WorkScheduleValidator(repo);

    await validator.validate(
      createValidationContext({ tenantId: 't-xyz', employeeId: 'e-xyz' }),
    );

    expect(spy).toHaveBeenCalledWith('e-xyz', 't-xyz');
  });
});
