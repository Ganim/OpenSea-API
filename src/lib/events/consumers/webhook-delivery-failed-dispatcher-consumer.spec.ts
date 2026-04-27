/**
 * Wave 0 spec stub — Phase 11 / Plan 11-02 will implement
 * `src/lib/events/consumers/webhook-delivery-failed-dispatcher-consumer.ts`.
 *
 * Subscribes to synthetic events `system.webhook.delivery_failed` and
 * `system.webhook.auto_disabled` published by the worker, and dispatches
 * notifications via notificationClient with the `system.webhook.delivery_failed`
 * category. URL is passed via dispatch.data.url (V1 simplification A10/A11 —
 * manifest does NOT embed URL declaratively).
 */
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  notificationClient: { dispatch: vi.fn() },
}));

vi.mock('@/modules/notifications/public', () => ({
  notificationClient: mocks.notificationClient,
}));

describe('webhook-delivery-failed-dispatcher-consumer (Plan 11-02 target)', () => {
  it("subscreve evento sintético DELIVERY_DEAD/AUTO_DISABLED publicado pelo worker → chama notificationClient.dispatch({ category: 'system.webhook.delivery_failed', data: { url: '/devices/webhooks/${endpointId}' } })", () => {
    expect(
      true,
      'Plan 11-02 must subscribe to system.webhook.delivery_failed + system.webhook.auto_disabled and dispatch notification with category=system.webhook.delivery_failed and data.url=/devices/webhooks/<id>',
    ).toBe(false);
  });

  it('passa data.url no dispatch (V1 simplification A10/A11 — manifest não embeda URL declarativa)', () => {
    expect(
      true,
      'Plan 11-02 must include data.url in the dispatch payload (manifest schema does not declaratively embed URL — passed at dispatch time)',
    ).toBe(false);
  });
});
