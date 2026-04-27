/**
 * Wave 0 spec stub — Phase 11 / Plan 11-02 will implement
 * `src/use-cases/system/webhooks/reprocess-webhook-deliveries-bulk.ts`.
 */
import { describe, expect, it } from 'vitest';

describe('ReprocessWebhookDeliveriesBulkUseCase (Plan 11-02 target)', () => {
  it('bulk respeita cap individual por delivery (cada uma com max 3 + cooldown 30s)', () => {
    expect(
      true,
      'Plan 11-02 must apply per-delivery checks: skip deliveries with manualReprocessCount >= 3 OR cooldown active (lastManualReprocessAt within 30s)',
    ).toBe(false);
  });

  it('retorna { enqueued: N, skippedCooldown: M, skippedCap: K } agregado', () => {
    expect(
      true,
      'Plan 11-02 must return aggregated counts so the UI can show "X reenviadas, Y já no limite, Z em cooldown"',
    ).toBe(false);
  });
});
