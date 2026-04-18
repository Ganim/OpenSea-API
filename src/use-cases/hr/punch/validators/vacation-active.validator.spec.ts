import { describe, expect, it, vi } from 'vitest';

import type { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

import { createValidationContext } from '../__fixtures__/create-validation-context';
import { VacationActiveValidator } from './vacation-active.validator';

function makeRepo(
  findManyByEmployeeAndStatus: VacationPeriodsRepository['findManyByEmployeeAndStatus'],
): VacationPeriodsRepository {
  return {
    findManyByEmployeeAndStatus,
  } as unknown as VacationPeriodsRepository;
}

describe('VacationActiveValidator', () => {
  it('ACCEPTs when the employee has no matching vacation period', async () => {
    const repo = makeRepo(vi.fn().mockResolvedValue([]));
    const validator = new VacationActiveValidator(repo);

    const decision = await validator.validate(createValidationContext());

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });

  it('REJECTs with ON_VACATION when an IN_PROGRESS period covers the timestamp', async () => {
    const ts = new Date('2026-04-18T12:00:00Z');
    const findManyMock = vi.fn().mockImplementation(async (_empId, status) => {
      if (status === 'IN_PROGRESS') {
        return [
          {
            scheduledStart: new Date('2026-04-10T00:00:00Z'),
            scheduledEnd: new Date('2026-04-25T23:59:59Z'),
          },
        ];
      }
      return [];
    });
    const repo = makeRepo(findManyMock);
    const validator = new VacationActiveValidator(repo);

    const decision = await validator.validate(
      createValidationContext({ timestamp: ts }),
    );

    expect(decision.outcome).toBe('REJECT');
    if (decision.outcome === 'REJECT') {
      expect(decision.code).toBe('ON_VACATION');
      expect(decision.reason).toContain('férias');
    }
  });

  it('ACCEPTs when a SCHEDULED period exists but lies in the past', async () => {
    const findManyMock = vi.fn().mockImplementation(async (_empId, status) => {
      if (status === 'SCHEDULED') {
        return [
          {
            scheduledStart: new Date('2025-01-01T00:00:00Z'),
            scheduledEnd: new Date('2025-01-15T23:59:59Z'),
          },
        ];
      }
      return [];
    });
    const repo = makeRepo(findManyMock);
    const validator = new VacationActiveValidator(repo);

    const decision = await validator.validate(
      createValidationContext({
        timestamp: new Date('2026-04-18T12:00:00Z'),
      }),
    );

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });

  it('ignores periods without a scheduled window (AVAILABLE status with no scheduling)', async () => {
    // Status in {IN_PROGRESS, SCHEDULED} but the row carries no scheduled
    // dates — defensive data. Validator should not crash.
    const findManyMock = vi
      .fn()
      .mockResolvedValue([
        { scheduledStart: undefined, scheduledEnd: undefined },
      ]);
    const repo = makeRepo(findManyMock);
    const validator = new VacationActiveValidator(repo);

    const decision = await validator.validate(createValidationContext());

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });
});
