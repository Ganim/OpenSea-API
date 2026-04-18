/**
 * Concrete implementation of the public NotificationClient.
 *
 * Delegates every call to the internal dispatcher. Kept as a thin facade
 * so the public SDK surface can stay stable even if the engine internals
 * are reorganized.
 */

import type { NotificationDispatcher } from '../dispatcher/notification-dispatcher.js';
import type { NotificationClient } from '../public/client.js';
import type {
  DispatchNotificationInput,
  DispatchResult,
  ProgressUpdateInput,
  ResolveNotificationInput,
  ResolveNotificationResult,
} from '../public/events.js';
import type { ModuleNotificationManifest } from '../public/types.js';

export class NotificationClientImpl implements NotificationClient {
  constructor(private readonly dispatcher: NotificationDispatcher) {}

  dispatch(input: DispatchNotificationInput): Promise<DispatchResult> {
    return this.dispatcher.dispatch(input);
  }

  resolve(input: ResolveNotificationInput): Promise<ResolveNotificationResult> {
    return this.dispatcher.resolve(input);
  }

  updateProgress(input: ProgressUpdateInput): Promise<void> {
    return this.dispatcher.updateProgress(input);
  }

  registerManifest(manifest: ModuleNotificationManifest): Promise<void> {
    return this.dispatcher.registerManifest(manifest);
  }

  cancel(notificationId: string): Promise<void> {
    return this.dispatcher.cancel(notificationId);
  }
}
