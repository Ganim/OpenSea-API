/**
 * NotificationClient — public SDK for the notifications module.
 *
 * Any module that needs to trigger a notification imports this client.
 * The client is a thin facade over the internal dispatcher, keeping
 * the contract stable across implementation changes.
 *
 * Example:
 *   import { notificationClient, NotificationType } from '@/modules/notifications/public'
 *
 *   await notificationClient.dispatch({
 *     type: NotificationType.APPROVAL,
 *     category: 'hr.vacation_request',
 *     tenantId,
 *     recipients: { permission: 'hr.vacations.approve' },
 *     title: 'Solicitação de férias pendente',
 *     body: `${employeeName} solicitou ${days} dias.`,
 *     idempotencyKey: `vacation:${requestId}:approval`,
 *     callbackUrl: '/v1/hr/vacations/approval-callback',
 *     entity: { type: 'vacation_request', id: requestId },
 *     expiresAt: addDays(new Date(), 7),
 *   })
 */

import type {
  DispatchNotificationInput,
  DispatchResult,
  ProgressUpdateInput,
  ResolveNotificationInput,
  ResolveNotificationResult,
} from './events';
import type { ModuleNotificationManifest } from './types';

export interface NotificationClient {
  dispatch(input: DispatchNotificationInput): Promise<DispatchResult>;
  resolve(input: ResolveNotificationInput): Promise<ResolveNotificationResult>;
  updateProgress(input: ProgressUpdateInput): Promise<void>;
  registerManifest(manifest: ModuleNotificationManifest): Promise<void>;
  cancel(notificationId: string): Promise<void>;
}

let instance: NotificationClient | null = null;

export function setNotificationClient(client: NotificationClient): void {
  instance = client;
}

export function getNotificationClient(): NotificationClient {
  if (!instance) {
    throw new Error(
      'NotificationClient not initialized. Make sure the notifications module is bootstrapped before use.',
    );
  }
  return instance;
}

/**
 * Convenience proxy — calls the currently-registered client.
 * Use this in module code where importing a symbol is preferable to
 * calling `getNotificationClient()` in every call site.
 */
export const notificationClient: NotificationClient = {
  dispatch: (input) => getNotificationClient().dispatch(input),
  resolve: (input) => getNotificationClient().resolve(input),
  updateProgress: (input) => getNotificationClient().updateProgress(input),
  registerManifest: (manifest) =>
    getNotificationClient().registerManifest(manifest),
  cancel: (notificationId) => getNotificationClient().cancel(notificationId),
};
