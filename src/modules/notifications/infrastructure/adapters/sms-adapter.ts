/**
 * SMS adapter — stub that logs and returns SKIPPED when SMS feature flag
 * is off. Phase 8 will wire Zenvia (BR) with a budget cap.
 */

import { logger } from '@/lib/logger.js';

import type { Notification } from '../../../../../prisma/generated/prisma/client.js';

import type {
  ChannelAdapter,
  ChannelDeliveryResult,
} from './channel-adapter.js';

export class SmsChannelAdapter implements ChannelAdapter {
  readonly channel = 'SMS';

  async send(notification: Notification): Promise<ChannelDeliveryResult> {
    const enabled = process.env.SMS_NOTIFICATIONS_ENABLED === 'true';
    if (!enabled) {
      return { status: 'SKIPPED', error: 'SMS feature flag disabled' };
    }
    // Phase 8: call Zenvia provider here, check budget, etc.
    logger?.info?.(
      { notificationId: notification.id },
      '[notifications] SMS stub — would send message',
    );
    return { status: 'SKIPPED', providerName: 'stub' };
  }
}

export class WhatsappChannelAdapter implements ChannelAdapter {
  readonly channel = 'WHATSAPP';

  async send(notification: Notification): Promise<ChannelDeliveryResult> {
    const enabled = process.env.WHATSAPP_NOTIFICATIONS_ENABLED === 'true';
    if (!enabled) {
      return { status: 'SKIPPED', error: 'WhatsApp feature flag disabled' };
    }
    logger?.info?.(
      { notificationId: notification.id },
      '[notifications] WhatsApp stub — would send message',
    );
    return { status: 'SKIPPED', providerName: 'stub' };
  }
}
