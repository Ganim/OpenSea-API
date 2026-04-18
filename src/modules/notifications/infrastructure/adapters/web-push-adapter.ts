/**
 * Web Push adapter — delivers a push notification to every active
 * subscription registered by the user. Requires VAPID keys in env:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 *
 * If VAPID is not configured the adapter returns SKIPPED so the boot
 * sequence can still complete on environments without push keys.
 */

import { prisma } from '@/lib/prisma.js';

import type { Notification } from '../../../../../prisma/generated/prisma/client.js';

import type {
  ChannelAdapter,
  ChannelDeliveryResult,
} from './channel-adapter.js';

let webPushPromise: Promise<typeof import('web-push') | null> | null = null;

async function getWebPush(): Promise<typeof import('web-push') | null> {
  if (!webPushPromise) {
    webPushPromise = (async () => {
      try {
        const mod = await import('web-push');
        const webpush = mod.default ?? mod;
        const pub = process.env.VAPID_PUBLIC_KEY;
        const priv = process.env.VAPID_PRIVATE_KEY;
        const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@opensea.app';
        if (!pub || !priv) return null;
        webpush.setVapidDetails(subject, pub, priv);
        return webpush as typeof import('web-push');
      } catch {
        return null;
      }
    })();
  }
  return webPushPromise;
}

export class WebPushChannelAdapter implements ChannelAdapter {
  readonly channel = 'PUSH';

  async send(notification: Notification): Promise<ChannelDeliveryResult> {
    const webpush = await getWebPush();
    if (!webpush) {
      return { status: 'SKIPPED', error: 'web-push not configured' };
    }

    const subs = await prisma.pushSubscription.findMany({
      where: { userId: notification.userId, revokedAt: null },
    });
    if (subs.length === 0) {
      return { status: 'SKIPPED', error: 'no active push subscriptions' };
    }

    const payload = JSON.stringify({
      notificationId: notification.id,
      title: notification.title,
      body: notification.message,
      actionUrl: notification.actionUrl,
      kind: notification.kind,
    });

    const start = Date.now();
    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dhKey, auth: s.authKey },
          },
          payload,
        ),
      ),
    );

    const failed = results.filter((r) => r.status === 'rejected');
    const delivered = results.length - failed.length;

    // Revoke subscriptions that returned 404/410 (browser unregistered them)
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'rejected') {
        const err = r.reason as { statusCode?: number } | undefined;
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.pushSubscription.update({
            where: { id: subs[i].id },
            data: { revokedAt: new Date() },
          });
        }
      }
    }

    if (delivered === 0) {
      return {
        status: 'FAILED',
        providerName: 'web-push',
        error: `all ${results.length} subscriptions failed`,
        latencyMs: Date.now() - start,
      };
    }
    return {
      status: 'SENT',
      providerName: 'web-push',
      latencyMs: Date.now() - start,
    };
  }
}
