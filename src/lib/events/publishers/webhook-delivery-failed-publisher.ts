/**
 * Webhook delivery failed publisher — Phase 11 / Plan 11-02 Task 6 (B2 fix).
 *
 * Helper dedicado que o worker chama em 3 sites (DEAD individual, auto-disable
 * consecutive_dead, auto-disable HTTP 410). Separado em arquivo próprio para:
 *   (a) ser unit-testável independente do worker
 *   (b) facilitar mock em vi.mock no spec do worker
 *   (c) ter target concreto para spec stub criado em 11-01 Task 9
 *
 * Reason values são lowercase snake-style (NÃO confundir com enum
 * WebhookAutoDisableReason em uppercase no schema.prisma — esta é a string
 * semântica do EVENTO, não do enum DB).
 */
import { ulid } from 'ulid';

import { getTypedEventBus } from '../typed-event-bus';

export type WebhookDeliveryFailedReason =
  | 'dead' // DEAD individual sem auto-disable trigger
  | 'auto_disabled_consecutive_dead' // 10ª DEAD consecutiva → AUTO_DISABLED (D-25)
  | 'auto_disabled_http_410'; // HTTP 410 Gone na 1ª delivery → AUTO_DISABLED (D-25)

export async function emitDeliveryFailedEvent(
  endpoint: { id: string; tenantId: string; url: string },
  delivery: { id: string; eventId: string },
  reason: WebhookDeliveryFailedReason,
): Promise<void> {
  const type =
    reason === 'dead'
      ? 'system.webhook.delivery_failed'
      : 'system.webhook.auto_disabled';

  await getTypedEventBus().publish({
    id: `evt_${ulid()}`,
    type,
    version: 1,
    tenantId: endpoint.tenantId,
    source: 'system.webhooks',
    sourceEntityType: 'webhook_endpoint',
    sourceEntityId: endpoint.id,
    timestamp: new Date().toISOString(),
    data: {
      tenantId: endpoint.tenantId,
      endpointId: endpoint.id,
      reason,
      endpointUrl: endpoint.url,
      deliveryId: delivery.id,
      eventId: delivery.eventId,
    },
  });
}
