/**
 * Phase 11 / Plan 11-02 — webhook-delivery-failed-dispatcher-consumer spec.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  notificationClient: { dispatch: vi.fn() },
}));

vi.mock('@/modules/notifications/public', () => ({
  notificationClient: mocks.notificationClient,
}));

import {
  SYSTEM_WEBHOOK_EVENTS,
  webhookDeliveryFailedDispatcherConsumer,
} from './webhook-delivery-failed-dispatcher-consumer';

describe('webhook-delivery-failed-dispatcher-consumer', () => {
  beforeEach(() => {
    mocks.notificationClient.dispatch.mockReset();
    mocks.notificationClient.dispatch.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("subscreve evento sintético DELIVERY_DEAD/AUTO_DISABLED publicado pelo worker → chama notificationClient.dispatch({ category: 'system.webhook.delivery_failed', data: { url: '/devices/webhooks/${endpointId}' } })", async () => {
    expect([...webhookDeliveryFailedDispatcherConsumer.subscribesTo]).toEqual([
      SYSTEM_WEBHOOK_EVENTS.DELIVERY_FAILED,
      SYSTEM_WEBHOOK_EVENTS.AUTO_DISABLED,
    ]);

    await webhookDeliveryFailedDispatcherConsumer.handle({
      id: 'evt_a',
      type: 'system.webhook.delivery_failed',
      version: 1,
      tenantId: 't1',
      source: 'system.webhooks',
      sourceEntityType: 'webhook_endpoint',
      sourceEntityId: 'wh_1',
      timestamp: new Date().toISOString(),
      data: {
        tenantId: 't1',
        endpointId: 'wh_1',
        reason: 'dead',
        endpointUrl: 'https://api.example.com/hook',
      },
    });

    expect(mocks.notificationClient.dispatch).toHaveBeenCalledTimes(1);
    const arg = mocks.notificationClient.dispatch.mock.calls[0][0];
    expect(arg.category).toBe('system.webhook.delivery_failed');
    expect(arg.data.url).toBe('/devices/webhooks/wh_1');
  });

  it('passa data.url no dispatch (V1 simplification A10/A11 — manifest não embeda URL declarativa)', async () => {
    await webhookDeliveryFailedDispatcherConsumer.handle({
      id: 'evt_b',
      type: 'system.webhook.auto_disabled',
      version: 1,
      tenantId: 't1',
      source: 'system.webhooks',
      sourceEntityType: 'webhook_endpoint',
      sourceEntityId: 'wh_2',
      timestamp: new Date().toISOString(),
      data: {
        tenantId: 't1',
        endpointId: 'wh_2',
        reason: 'auto_disabled_consecutive_dead',
        endpointUrl: 'https://api.example.com/hook',
      },
    });

    const arg = mocks.notificationClient.dispatch.mock.calls[0][0];
    expect(arg.data).toBeDefined();
    expect(arg.data.url).toBe('/devices/webhooks/wh_2');
  });
});
