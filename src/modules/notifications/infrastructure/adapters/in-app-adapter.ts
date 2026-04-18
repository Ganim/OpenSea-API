/**
 * IN_APP adapter — the notification is already persisted in the DB and
 * emitted to the Socket.IO user room by the dispatcher itself. This
 * adapter just records a successful delivery attempt.
 */

import type {
  ChannelAdapter,
  ChannelDeliveryResult,
} from './channel-adapter.js';

export class InAppChannelAdapter implements ChannelAdapter {
  readonly channel = 'IN_APP';

  async send(): Promise<ChannelDeliveryResult> {
    return {
      status: 'DELIVERED',
      providerName: 'socket.io',
    };
  }
}
