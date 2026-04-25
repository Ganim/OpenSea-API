// Wave 0 stub — Phase 9 / Plan 09-01. Implementation arrives in Plan 09-02. See 09-VALIDATION.md.
//
// PUNCH-FRAUD-02 — Clock drift validator.
// Plan 09-02 implements `ClockDriftValidator`:
//   - |body.timestamp - serverNow| > 120s → REJECT CLOCK_DRIFT (D-06/D-07)
//   - drift in (30s, 120s] → metadata.clockDriftSec for audit (D-08)

import { describe, it, expect } from 'vitest';

describe('ClockDriftValidator (Plan 09-02 — Wave 0 stub)', () => {
  it('placeholder — Wave 0 RED gate; replaced in Plan 09-02', () => {
    expect(() => require('./clock-drift.validator')).toThrow();
  });

  it.skip('drift=119s → ACCEPT', () => {});
  it.skip('drift=120s → ACCEPT (boundary)', () => {});
  it.skip('drift=121s → REJECT CLOCK_DRIFT', () => {});
  it.skip('drift=29s → no audit field (below audit threshold)', () => {});
  it.skip('drift=30s → metadata.clockDriftSec=30 (audit boundary)', () => {});
  it.skip('drift=119s → metadata.clockDriftSec=119 (audit captured)', () => {});
});
