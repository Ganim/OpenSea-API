// Wave 0 stub — Phase 9 / Plan 09-01. Implementation arrives in Plan 09-04. See 09-VALIDATION.md.
//
// PUNCH-NOTIF-07 — Missed punch notification consumer.
// Plan 09-04 implements the BullMQ consumer that reads
// `punch.missed-punches.detected` events (Phase 7 detect-missed-punches job)
// and dispatches notifications:
//   - 1 aggregated notification per gestor (D-23, "+N mais" >5 list)
//   - 1 individual notification per funcionário ausente (D-21)

import { describe, it, expect } from 'vitest';

describe('missedPunchNotificationConsumer (Plan 09-04 — Wave 0 stub)', () => {
  it('placeholder — Wave 0 RED gate; replaced in Plan 09-04', () => {
    expect(() => require('./missed-punch-notification-consumer')).toThrow();
  });

  it.skip('MISSED_PUNCHES_DETECTED → 1 notification por gestor (lista agregada com até 5 funcionários)', () => {});
  it.skip('lista com >5 funcionários → "+N mais" (truncar em 5 nomes)', () => {});
  it.skip('1 notification individual por funcionário ausente', () => {});
  it.skip('cross-tenant isolation: tenant A não recebe lista de tenant B', () => {});
});
