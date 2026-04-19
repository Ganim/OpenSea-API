/**
 * Generic module notifier — thin typed wrapper around notificationClient.dispatch()
 * so each business domain (finance/stock/tasks/requests/...) can expose its own
 * notifier with category codes constrained to its manifest.
 *
 * Why: module use-cases MUST NOT import NotificationsRepository (v1) or invoke
 * CreateNotificationUseCase directly. The only sanctioned path to trigger a
 * notification is through the public dispatcher SDK — this helper enforces it.
 *
 * This module defines the interface + in-memory implementation only. The
 * prisma-backed `DefaultModuleNotifier` lives in `default-module-notifier.ts`
 * so test specs can import `InMemoryModuleNotifier` without loading prisma.
 */

import type { NotificationPriority } from '@/modules/notifications/public';

export interface DispatchSimpleNotificationInput<Category extends string> {
  /** Category code from your module's manifest. Typo → compile error. */
  category: Category;
  tenantId: string;
  recipientUserId: string;
  title: string;
  body: string;
  priority?: NotificationPriority;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  actionText?: string;
  /** Used to build a stable idempotencyKey: `${category}:${entityId ?? 'no-entity'}:${dedupeSuffix ?? recipientUserId}` */
  dedupeSuffix?: string;
}

export interface ModuleNotifier<Category extends string> {
  dispatch(input: DispatchSimpleNotificationInput<Category>): Promise<void>;
}

/**
 * Test-only implementation that records dispatches in memory.
 * Safe to import in specs — no prisma, no dispatcher, no env needed.
 */
export class InMemoryModuleNotifier<Category extends string>
  implements ModuleNotifier<Category>
{
  public dispatches: DispatchSimpleNotificationInput<Category>[] = [];

  async dispatch(
    input: DispatchSimpleNotificationInput<Category>,
  ): Promise<void> {
    this.dispatches.push(input);
  }
}
