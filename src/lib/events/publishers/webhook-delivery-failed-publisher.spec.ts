/**
 * Wave 0 spec stub — Phase 11 / Plan 11-02 will implement
 * `src/lib/events/publishers/webhook-delivery-failed-publisher.ts`.
 *
 * Helper `emitDeliveryFailedEvent(endpoint, delivery, reason)` publishes either
 *   - 'system.webhook.delivery_failed'   (DEAD individual sem auto-disable)
 *   - 'system.webhook.auto_disabled'     (CONSECUTIVE_DEAD or HTTP_410_GONE)
 * via getTypedEventBus().publish.
 */
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  publish: vi.fn(),
}));

vi.mock('@/lib/events/typed-event-bus', () => ({
  getTypedEventBus: () => ({ publish: mocks.publish }),
}));

describe('webhook-delivery-failed-publisher (Plan 11-02 target)', () => {
  it("exporta `emitDeliveryFailedEvent(endpoint, delivery, reason)` que chama getTypedEventBus().publish com type ∈ {'system.webhook.delivery_failed', 'system.webhook.auto_disabled'}", () => {
    expect(
      true,
      'Plan 11-02 must export emitDeliveryFailedEvent helper that publishes events with type system.webhook.delivery_failed OR system.webhook.auto_disabled',
    ).toBe(false);
  });

  it("o payload publicado tem shape `{ id, type, tenantId, occurredAt, data: { tenantId, endpointId, reason, endpointUrl } }` — id é evt_<ulid>, occurredAt é Date, reason ∈ {'dead', 'auto_disabled_consecutive_dead', 'auto_disabled_http_410'}", () => {
    expect(
      true,
      'Plan 11-02 must publish payload with id=evt_<ulid>, type, tenantId, occurredAt: Date, data.{ tenantId, endpointId, reason, endpointUrl } — reason values verbatim',
    ).toBe(false);
  });

  it("emite type='system.webhook.auto_disabled' quando reason ∈ {'auto_disabled_consecutive_dead','auto_disabled_http_410'}; emite type='system.webhook.delivery_failed' quando reason='dead' (DEAD individual sem auto-disable)", () => {
    expect(
      true,
      'Plan 11-02 must select type based on reason — auto_disabled_* → system.webhook.auto_disabled; dead → system.webhook.delivery_failed',
    ).toBe(false);
  });
});
