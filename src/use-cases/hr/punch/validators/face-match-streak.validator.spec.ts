// Wave 0 stub — Phase 9 / Plan 09-01. Implementation arrives in Plan 09-02. See 09-VALIDATION.md.
//
// PUNCH-FRAUD-07 — Face match 3x consecutive failures (60min sliding window).
// Plan 09-02 implements `FaceMatchStreakValidator` with Redis INCR/EXPIRE/DEL:
//   key=`punch:facematch:fail:{tenantId}:{employeeId}` TTL 3600 (D-09)
//   counter ≥ 3 → APPROVAL_REQUIRED FACE_MATCH_FAIL_3X + emit PUNCH_EVENTS.FACE_MATCH_FAIL_3X (D-10)
//   match:ok → DEL key (reset only on successful match — D-12)

import { describe, it, expect } from 'vitest';

describe('FaceMatchStreakValidator (Plan 09-02 — Wave 0 stub)', () => {
  it('placeholder — Wave 0 RED gate; replaced in Plan 09-02', () => {
    expect(() => require('./face-match-streak.validator')).toThrow();
  });

  it.skip('counter=0 + match:low → counter=1, ACCEPT', () => {});
  it.skip('counter=2 + match:low → counter=3, APPROVAL_REQUIRED FACE_MATCH_FAIL_3X + emit event', () => {});
  it.skip('match:ok → DEL key (reset counter)', () => {});
  it.skip('TTL EXPIRE só no primeiro INCR (não re-aplica em incrementos subsequentes)', () => {});
});
