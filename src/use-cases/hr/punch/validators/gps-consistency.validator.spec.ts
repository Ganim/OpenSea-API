// Wave 0 stub — Phase 9 / Plan 09-01. Implementation arrives in Plan 09-02. See 09-VALIDATION.md.
//
// PUNCH-FRAUD-01 — GPS consistency validator.
// Plan 09-02 implements `GpsConsistencyValidator` with thresholds:
//   - accuracy > 100m → REJECT GPS_ACCURACY_LOW (D-01)
//   - velocity > 200 km/h → APPROVAL_REQUIRED GPS_INCONSISTENT (D-02)
//   - suspectMock=true → APPROVAL_REQUIRED with details.suspectMock=true (D-04)

import { describe, it, expect } from 'vitest';

describe('GpsConsistencyValidator (Plan 09-02 — Wave 0 stub)', () => {
  it('placeholder — Wave 0 RED gate; replaced in Plan 09-02', () => {
    // Wave 0 stub. Plan 09-02 implements GpsConsistencyValidator. Until then,
    // requiring the file MUST throw because the implementation does not exist.
    expect(() => require('./gps-consistency.validator')).toThrow();
  });

  it.skip('accuracy=99 → ACCEPT (below threshold)', () => {});
  it.skip('accuracy=100 → ACCEPT (boundary, ≤)', () => {});
  it.skip('accuracy=101 → REJECT GPS_ACCURACY_LOW (above threshold)', () => {});
  it.skip('velocity=199 km/h → ACCEPT', () => {});
  it.skip('velocity=200 km/h → ACCEPT (boundary)', () => {});
  it.skip('velocity=201 km/h → APPROVAL_REQUIRED GPS_INCONSISTENT', () => {});
  it.skip('first batida (no prev TimeEntry) → skip velocity check', () => {});
  it.skip('suspectMock=true → APPROVAL_REQUIRED with details.suspectMock=true', () => {});
});
