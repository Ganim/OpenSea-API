/**
 * Webhook delivery failed dispatcher consumer — Phase 11 / Plan 11-02 / D-24.
 *
 * Subscreve eventos sintéticos publicados pelo webhookDeliveryWorker (via
 * webhook-delivery-failed-publisher):
 *   - 'system.webhook.delivery_failed' (DEAD individual)
 *   - 'system.webhook.auto_disabled'   (auto-disable trigger)
 *
 * Chama notificationClient.dispatch com category 'system.webhook.delivery_failed'
 * (ACTIONABLE/HIGH/[IN_APP, EMAIL] — manifest 11-01) e data.url =
 * '/devices/webhooks/${endpointId}' para o botão "Ver no painel"
 * (V1 simplification A10/A11 — manifest não embed URL declarativa).
 */
import { notificationClient } from '@/modules/notifications/public';

import type { DomainEvent, EventConsumer } from '../domain-event.interface';

export const SYSTEM_WEBHOOK_EVENTS = {
  DELIVERY_FAILED: 'system.webhook.delivery_failed',
  AUTO_DISABLED: 'system.webhook.auto_disabled',
} as const;

let _logger: {
  info: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = {
        info: (obj, msg) => console.log(msg, obj),
        warn: (obj, msg) => console.warn(msg, obj),
        error: (obj, msg) => console.error(msg, obj),
      };
    }
  }
  return _logger!;
}

export const webhookDeliveryFailedDispatcherConsumer: EventConsumer = {
  consumerId: 'system.webhooks.delivery-failed-dispatcher',
  moduleId: 'system.webhooks',
  subscribesTo: [
    SYSTEM_WEBHOOK_EVENTS.DELIVERY_FAILED,
    SYSTEM_WEBHOOK_EVENTS.AUTO_DISABLED,
  ],

  async handle(event: DomainEvent): Promise<void> {
    const data = event.data as {
      tenantId: string;
      endpointId: string;
      reason: string;
      endpointUrl: string;
    };

    let endpointHost = data.endpointUrl;
    try {
      endpointHost = new URL(data.endpointUrl).hostname;
    } catch {
      // fallback: deixa endpointUrl intacto
    }

    try {
      // Dispatch usa notificationClient.dispatch — SDK público das notifications.
      // Plan-level cast: o módulo notification expõe `dispatch` mas o tipo discriminado
      // requer recipients/title/body. Para simplificar V1 (manifest categoria já registrada),
      // passamos input com type LINK + actionUrl no data.url para resolver "Ver no painel".
      // Notifications module resolverá recipients via permissão `system.webhooks.endpoints.admin`.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dispatchInput: any = {
        tenantId: data.tenantId,
        category: 'system.webhook.delivery_failed',
        type: 'LINK',
        recipients: { permission: 'system.webhooks.endpoints.admin' },
        title: 'Falha de entrega de webhook',
        body: `Falha em ${endpointHost} (${data.reason})`,
        actionUrl: `/devices/webhooks/${data.endpointId}`,
        idempotencyKey: `system.webhook.delivery_failed:${data.endpointId}:${event.id}`,
        data: {
          endpointId: data.endpointId,
          endpointUrl: endpointHost,
          reason: data.reason,
          url: `/devices/webhooks/${data.endpointId}`,
        },
        entity: { type: 'webhook_endpoint', id: data.endpointId },
      };
      await notificationClient.dispatch(dispatchInput);
    } catch (err) {
      getLogger().error(
        { err, endpointId: data.endpointId },
        '[WebhookDispatcher] Failed to dispatch notification',
      );
      // Não re-throw — typedEventBus retry mas notif perdida não bloqueia entrega
    }
  },
};
