/**
 * Channel adapter contract.
 *
 * Each delivery channel (IN_APP, EMAIL, PUSH, SMS, WHATSAPP) has an
 * adapter that knows how to deliver a notification through that medium.
 * Adapters are registered with the dispatcher at boot time.
 *
 * Returning `SKIPPED` means "nothing to do here" (e.g. IN_APP is already
 * persisted in DB so the adapter does no extra work). `FAILED` means
 * the attempt raised — the dispatcher will log a delivery attempt row
 * but will not throw.
 */

import type { Notification } from '../../../../../prisma/generated/prisma/client.js';

export type ChannelDeliveryStatus =
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'SKIPPED';

export interface ChannelDeliveryResult {
  status: ChannelDeliveryStatus;
  providerId?: string;
  providerName?: string;
  error?: string;
  latencyMs?: number;
}

export interface ChannelAdapter {
  readonly channel: string;
  send(notification: Notification): Promise<ChannelDeliveryResult>;
}

export class ChannelRegistry {
  private readonly adapters = new Map<string, ChannelAdapter>();

  register(adapter: ChannelAdapter): void {
    this.adapters.set(adapter.channel, adapter);
  }

  get(channel: string): ChannelAdapter | undefined {
    return this.adapters.get(channel);
  }

  list(): ChannelAdapter[] {
    return Array.from(this.adapters.values());
  }
}
