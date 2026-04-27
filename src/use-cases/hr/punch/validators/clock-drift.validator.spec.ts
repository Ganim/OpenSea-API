// Phase 9 / Plan 09-02 — ClockDriftValidator spec (Wave 0 RED → GREEN).
//
// PUNCH-FRAUD-02 (D-05 / D-06 / D-07 / D-08 — clock drift detection).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  ClockDriftValidator,
  CLOCK_DRIFT_TOLERANCE_SEC,
  CLOCK_DRIFT_AUDIT_THRESHOLD_SEC,
} from './clock-drift.validator';
import type { PunchValidationContext } from './punch-validator.interface';

function makeCtx(
  clientTimestampIso?: string,
  overrides: Partial<PunchValidationContext> = {},
): PunchValidationContext {
  return {
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    timestamp: new Date('2026-04-25T10:00:00Z'),
    clientTimestampIso,
    punchConfig: { geofenceEnabled: false },
    ...overrides,
  };
}

describe('ClockDriftValidator (Plan 09-02)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('drift=119s ACCEPT (below tolerance)', async () => {
    const v = new ClockDriftValidator();
    const result = await v.validate(makeCtx('2026-04-25T09:58:01Z'));
    expect(result.outcome).toBe('ACCEPT');
  });

  it('drift=120s ACCEPT (boundary, equals tolerance — strictly >)', async () => {
    const v = new ClockDriftValidator();
    const result = await v.validate(makeCtx('2026-04-25T09:58:00Z'));
    expect(result.outcome).toBe('ACCEPT');
  });

  it('drift=121s REJECT CLOCK_DRIFT', async () => {
    const v = new ClockDriftValidator();
    const result = await v.validate(makeCtx('2026-04-25T09:57:59Z'));
    if (result.outcome !== 'REJECT') throw new Error('expected REJECT');
    expect(result.code).toBe('CLOCK_DRIFT');
    expect(result.reason).toMatch(/Ajuste o relógio/);
    expect(result.details?.driftSec).toBeGreaterThan(120);
    expect(result.details?.toleranceSec).toBe(120);
  });

  it('no clientTimestampIso → ACCEPT (legacy device-token path)', async () => {
    const v = new ClockDriftValidator();
    const result = await v.validate(makeCtx(undefined));
    expect(result.outcome).toBe('ACCEPT');
  });

  it('malformed ISO → ACCEPT (Zod upstream is the gate)', async () => {
    const v = new ClockDriftValidator();
    const result = await v.validate(makeCtx('not-a-date'));
    expect(result.outcome).toBe('ACCEPT');
  });

  it('CLOCK_DRIFT_TOLERANCE_SEC === 120; CLOCK_DRIFT_AUDIT_THRESHOLD_SEC === 30 (D-06/D-08)', () => {
    expect(CLOCK_DRIFT_TOLERANCE_SEC).toBe(120);
    expect(CLOCK_DRIFT_AUDIT_THRESHOLD_SEC).toBe(30);
  });
});
