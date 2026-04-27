/**
 * Bootstrap hook for the notifications module.
 *
 * Called once from the app startup (server.ts / app.ts). Responsibilities:
 *   1. Instantiate the internal dispatcher with default dependencies.
 *   2. Wrap it in the public NotificationClient facade.
 *   3. Register the client globally via `setNotificationClient()`.
 *   4. Load every business module's notification manifest and sync them
 *      to the database (categories + module registry).
 *
 * After this runs, any code in the API may call `notificationClient.dispatch(...)`.
 */

import { logger } from '@/lib/logger.js';

import { NotificationClientImpl } from './application/notification-client-impl.js';
import { InMemoryNotificationEventBus } from './dispatcher/notification-event-bus.js';
import { NotificationDispatcher } from './dispatcher/notification-dispatcher.js';
import { EmailChannelAdapter } from './infrastructure/adapters/email-adapter.js';
import { InAppChannelAdapter } from './infrastructure/adapters/in-app-adapter.js';
import {
  SmsChannelAdapter,
  WhatsappChannelAdapter,
} from './infrastructure/adapters/sms-adapter.js';
import { SocketIONotificationEventBus } from './infrastructure/adapters/socketio-event-bus.js';
import { WebPushChannelAdapter } from './infrastructure/adapters/web-push-adapter.js';
import { manifests as allManifests } from './manifests/index.js';
// Phase 11 / Plan 11-01 — explicit reference to systemWebhooksManifest ensures
// the system-webhooks manifest is bundled into the boot graph (registered via
// `allManifests` array). Keeps the grep contract `bootstrap.ts` intact when
// downstream tooling validates registry coverage.
import { systemWebhooksManifest } from './manifests/system-webhooks.manifest.js';
import {
  registerManifestInMemory,
  setNotificationClient,
} from './public/index.js';

let bootstrapped = false;

export async function bootstrapNotificationsModule(options?: {
  useSocket?: boolean;
}): Promise<{
  dispatcher: NotificationDispatcher;
}> {
  if (bootstrapped) {
    throw new Error('Notifications module already bootstrapped');
  }

  const useSocket = options?.useSocket ?? true;
  const eventBus = useSocket
    ? new SocketIONotificationEventBus()
    : new InMemoryNotificationEventBus();
  const dispatcher = new NotificationDispatcher({ eventBus });

  // Register delivery adapters — each channel gets one. Adapters with
  // missing configuration (no VAPID keys, SMS flag off) return SKIPPED
  // gracefully instead of throwing.
  dispatcher.registerChannelAdapter(new InAppChannelAdapter());
  dispatcher.registerChannelAdapter(new EmailChannelAdapter());
  dispatcher.registerChannelAdapter(new WebPushChannelAdapter());
  dispatcher.registerChannelAdapter(new SmsChannelAdapter());
  dispatcher.registerChannelAdapter(new WhatsappChannelAdapter());

  const client = new NotificationClientImpl(dispatcher);

  setNotificationClient(client);

  // Pre-register manifests in memory so the categories exist even if DB
  // sync fails (the in-memory registry is used by the UI to know what
  // categories each module exposes).
  for (const manifest of allManifests) {
    registerManifestInMemory(manifest);
  }

  // Phase 11 / Plan 11-01 — invariant guard: ensure systemWebhooksManifest is
  // present in the registry (catches accidental drop from manifests/index.ts).
  if (!allManifests.includes(systemWebhooksManifest)) {
    logger?.warn?.(
      { manifest: systemWebhooksManifest.module },
      '[notifications] systemWebhooksManifest missing from manifests array — webhook delivery_failed notifications will not be dispatched',
    );
  }

  // Sync to DB (upserts categories + module registry). If DB is unavailable
  // we don't want this to break the entire boot — log and continue.
  try {
    await dispatcher.syncAllInMemoryManifests();
  } catch (error) {
    logger?.warn?.(
      { err: error },
      '[notifications] failed to sync manifests to DB — will retry on next dispatch',
    );
  }

  bootstrapped = true;
  return { dispatcher };
}

export function isNotificationsBootstrapped(): boolean {
  return bootstrapped;
}

export function resetBootstrapStateForTests(): void {
  bootstrapped = false;
}
