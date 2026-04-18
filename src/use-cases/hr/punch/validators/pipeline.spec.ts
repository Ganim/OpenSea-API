import { describe, expect, it, vi } from 'vitest';

import { createValidationContext } from '../__fixtures__/create-validation-context';
import { PunchValidationPipeline } from './pipeline';
import type {
  PunchValidationDecision,
  PunchValidator,
} from './punch-validator.interface';

function stubValidator(
  name: string,
  decision: PunchValidationDecision,
  spyOut?: { calledWith?: unknown },
): PunchValidator {
  return {
    name,
    validate: vi.fn().mockImplementation(async (ctx) => {
      if (spyOut) spyOut.calledWith = ctx;
      return decision;
    }),
  };
}

describe('PunchValidationPipeline', () => {
  it('returns ACCEPT when every validator returns ACCEPT', async () => {
    const pipeline = new PunchValidationPipeline([
      stubValidator('v1', { outcome: 'ACCEPT' }),
      stubValidator('v2', { outcome: 'ACCEPT' }),
      stubValidator('v3', { outcome: 'ACCEPT' }),
    ]);

    const result = await pipeline.run(createValidationContext());

    expect(result).toEqual({ decision: 'ACCEPT', approvals: [] });
  });

  it('short-circuits on the first REJECT and does not call subsequent validators', async () => {
    const thirdSpy = vi.fn();
    const pipeline = new PunchValidationPipeline([
      stubValidator('v1', { outcome: 'ACCEPT' }),
      stubValidator('v2', {
        outcome: 'REJECT',
        code: 'EMPLOYEE_INACTIVE',
        reason: 'nope',
      }),
      { name: 'v3-never-called', validate: thirdSpy },
    ]);

    const result = await pipeline.run(createValidationContext());

    expect(result.decision).toBe('REJECT');
    if (result.decision === 'REJECT') {
      expect(result.rejection.code).toBe('EMPLOYEE_INACTIVE');
    }
    expect(thirdSpy).not.toHaveBeenCalled();
  });

  it('accumulates APPROVAL_REQUIRED without aborting, and returns ACCEPT_WITH_APPROVALS', async () => {
    const pipeline = new PunchValidationPipeline([
      stubValidator('v1', { outcome: 'ACCEPT' }),
      stubValidator('v2', {
        outcome: 'APPROVAL_REQUIRED',
        approvalReason: 'OUT_OF_GEOFENCE',
        reason: 'outside zone',
        details: { distance: 200 },
      }),
      stubValidator('v3', { outcome: 'ACCEPT' }),
    ]);

    const result = await pipeline.run(createValidationContext());

    expect(result.decision).toBe('ACCEPT_WITH_APPROVALS');
    if (result.decision === 'ACCEPT_WITH_APPROVALS') {
      expect(result.approvals).toHaveLength(1);
      expect(result.approvals[0]?.approvalReason).toBe('OUT_OF_GEOFENCE');
    }
  });

  it('REJECT takes precedence over previously-accumulated approvals', async () => {
    const pipeline = new PunchValidationPipeline([
      stubValidator('approval-first', {
        outcome: 'APPROVAL_REQUIRED',
        approvalReason: 'OUT_OF_GEOFENCE',
        reason: 'outside zone',
        details: {},
      }),
      stubValidator('reject-after', {
        outcome: 'REJECT',
        code: 'ON_VACATION',
        reason: 'on vacation',
      }),
    ]);

    const result = await pipeline.run(createValidationContext());

    expect(result.decision).toBe('REJECT');
    // approvals on REJECT result is always the empty tuple by type.
    expect(result.approvals).toEqual([]);
  });

  it('passes the same immutable context to every validator (validators must not mutate it)', async () => {
    const ctx = createValidationContext();
    const seen: unknown[] = [];

    const pipeline = new PunchValidationPipeline([
      {
        name: 'a',
        validate: async (c) => {
          seen.push(c);
          return { outcome: 'ACCEPT' };
        },
      },
      {
        name: 'b',
        validate: async (c) => {
          seen.push(c);
          return { outcome: 'ACCEPT' };
        },
      },
    ]);

    await pipeline.run(ctx);

    expect(seen).toHaveLength(2);
    expect(seen[0]).toBe(ctx);
    expect(seen[1]).toBe(ctx);
  });
});
