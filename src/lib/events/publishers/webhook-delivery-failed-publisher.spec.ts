/**
 * Phase 11 / Plan 11-02 — webhook-delivery-failed-publisher spec.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  publish: vi.fn(),
}));

vi.mock('@/lib/events/typed-event-bus', () => ({
  getTypedEventBus: () => ({ publish: mocks.publish }),
}));

import { emitDeliveryFailedEvent } from './webhook-delivery-failed-publisher';

const endpoint = {
  id: 'wh_1',
  tenantId: 't1',
  url: 'https://api.example.com/hook',
};
const delivery = { id: 'd1', eventId: 'evt_orig' };

describe('webhook-delivery-failed-publisher', () => {
  beforeEach(() => {
    mocks.publish.mockReset();
    mocks.publish.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mocks.publish.mockReset();
  });

  it("exporta `emitDeliveryFailedEvent(endpoint, delivery, reason)` que chama getTypedEventBus().publish com type ∈ {'system.webhook.delivery_failed', 'system.webhook.auto_disabled'}", async () => {
    await emitDeliveryFailedEvent(endpoint, delivery, 'dead');
    expect(mocks.publish).toHaveBeenCalledTimes(1);
    const arg = mocks.publish.mock.calls[0][0];
    expect([
      'system.webhook.delivery_failed',
      'system.webhook.auto_disabled',
    ]).toContain(arg.type);
  });

  it("o payload publicado tem shape `{ id, type, tenantId, occurredAt, data: { tenantId, endpointId, reason, endpointUrl } }` — id é evt_<ulid>, occurredAt é Date, reason ∈ {'dead', 'auto_disabled_consecutive_dead', 'auto_disabled_http_410'}", async () => {
    await emitDeliveryFailedEvent(endpoint, delivery, 'dead');
    const arg = mocks.publish.mock.calls[0][0];

    expect(arg.id).toMatch(/^evt_[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(arg.tenantId).toBe('t1');
    expect(arg.data.tenantId).toBe('t1');
    expect(arg.data.endpointId).toBe('wh_1');
    expect(arg.data.endpointUrl).toBe('https://api.example.com/hook');
    expect([
      'dead',
      'auto_disabled_consecutive_dead',
      'auto_disabled_http_410',
    ]).toContain(arg.data.reason);
  });

  it("emite type='system.webhook.auto_disabled' quando reason ∈ {'auto_disabled_consecutive_dead','auto_disabled_http_410'}; emite type='system.webhook.delivery_failed' quando reason='dead' (DEAD individual sem auto-disable)", async () => {
    await emitDeliveryFailedEvent(endpoint, delivery, 'dead');
    expect(mocks.publish.mock.calls[0][0].type).toBe(
      'system.webhook.delivery_failed',
    );

    mocks.publish.mockReset();
    mocks.publish.mockResolvedValue(undefined);
    await emitDeliveryFailedEvent(
      endpoint,
      delivery,
      'auto_disabled_consecutive_dead',
    );
    expect(mocks.publish.mock.calls[0][0].type).toBe(
      'system.webhook.auto_disabled',
    );

    mocks.publish.mockReset();
    mocks.publish.mockResolvedValue(undefined);
    await emitDeliveryFailedEvent(endpoint, delivery, 'auto_disabled_http_410');
    expect(mocks.publish.mock.calls[0][0].type).toBe(
      'system.webhook.auto_disabled',
    );
  });
});
