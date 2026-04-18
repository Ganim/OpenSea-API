import { describe, expect, it, vi } from 'vitest';

import type { AbsencesRepository } from '@/repositories/hr/absences-repository';

import { createValidationContext } from '../__fixtures__/create-validation-context';
import { AbsenceActiveValidator } from './absence-active.validator';

function makeRepo(
  findOverlapping: AbsencesRepository['findOverlapping'],
): AbsencesRepository {
  return { findOverlapping } as unknown as AbsencesRepository;
}

describe('AbsenceActiveValidator', () => {
  it('ACCEPTs when no overlapping absence exists', async () => {
    const repo = makeRepo(vi.fn().mockResolvedValue([]));
    const validator = new AbsenceActiveValidator(repo);

    const decision = await validator.validate(createValidationContext());

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });

  it('REJECTs with ON_SICK_LEAVE when an APPROVED absence overlaps', async () => {
    const repo = makeRepo(
      vi.fn().mockResolvedValue([
        {
          status: { value: 'APPROVED' },
          type: { value: 'SICK_LEAVE' },
        },
      ]),
    );
    const validator = new AbsenceActiveValidator(repo);

    const decision = await validator.validate(createValidationContext());

    expect(decision.outcome).toBe('REJECT');
    if (decision.outcome === 'REJECT') {
      expect(decision.code).toBe('ON_SICK_LEAVE');
    }
  });

  it('REJECTs when an IN_PROGRESS absence overlaps', async () => {
    const repo = makeRepo(
      vi.fn().mockResolvedValue([
        {
          status: { value: 'IN_PROGRESS' },
          type: { value: 'SICK_LEAVE' },
        },
      ]),
    );
    const validator = new AbsenceActiveValidator(repo);

    const decision = await validator.validate(createValidationContext());

    expect(decision.outcome).toBe('REJECT');
  });

  it('ACCEPTs when the overlapping absence is PENDING (not yet effective)', async () => {
    const repo = makeRepo(
      vi.fn().mockResolvedValue([
        {
          status: { value: 'PENDING' },
          type: { value: 'SICK_LEAVE' },
        },
      ]),
    );
    const validator = new AbsenceActiveValidator(repo);

    const decision = await validator.validate(createValidationContext());

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });

  it('ignores VACATION-typed absences (handled by VacationActiveValidator)', async () => {
    const repo = makeRepo(
      vi.fn().mockResolvedValue([
        {
          status: { value: 'APPROVED' },
          type: { value: 'VACATION' },
        },
      ]),
    );
    const validator = new AbsenceActiveValidator(repo);

    const decision = await validator.validate(createValidationContext());

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });
});
