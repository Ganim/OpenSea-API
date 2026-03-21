/**
 * Notification module event consumer — placeholder.
 *
 * Sends user notifications for important cross-module events
 * (e.g., order confirmed, deal won, campaign activated).
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { SALES_EVENTS } from '../sales-events';

// Lazy logger to avoid @env initialization in unit tests
let _logger: { info: (obj: unknown, msg: string) => void } | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = { info: (obj, msg) => console.log(msg, obj) };
    }
  }
  return _logger!;
}

export const notificationConsumer: EventConsumer = {
  consumerId: 'notifications.alert-handler',
  moduleId: 'notifications',
  subscribesTo: [
    SALES_EVENTS.DEAL_WON,
    SALES_EVENTS.ORDER_CONFIRMED,
    SALES_EVENTS.ORDER_CANCELLED,
    SALES_EVENTS.CAMPAIGN_ACTIVATED,
  ],

  async handle(event: DomainEvent): Promise<void> {
    getLogger().info(
      {
        eventId: event.id,
        type: event.type,
        tenantId: event.tenantId,
      },
      '[NotificationConsumer] Placeholder: send notification for event',
    );

    // TODO: Implement actual notification dispatch
    // await notificationService.send({
    //   tenantId: event.tenantId,
    //   type: mapEventToNotificationType(event.type),
    //   title: buildNotificationTitle(event),
    //   data: event.data,
    //   userId: event.metadata?.userId,
    // })
  },
};
