import { prisma } from '@/lib/prisma';
import {
  notificationClient,
  NotificationPriority,
  NotificationType,
} from '@/modules/notifications/public';

import type {
  DispatchSimpleNotificationInput,
  ModuleNotifier,
} from './module-notifier';

/**
 * Production implementation of ModuleNotifier. Looks up tenantId for the
 * recipient when not supplied and forwards to notificationClient.dispatch().
 */
export class DefaultModuleNotifier<Category extends string>
  implements ModuleNotifier<Category>
{
  async dispatch(
    input: DispatchSimpleNotificationInput<Category>,
  ): Promise<void> {
    const tenantId =
      input.tenantId ?? (await this.resolveTenantId(input.recipientUserId));
    if (!tenantId) return;

    const entityId = input.entityId ?? 'no-entity';
    const suffix = input.dedupeSuffix ?? input.recipientUserId;

    await notificationClient.dispatch({
      type: input.actionUrl
        ? NotificationType.LINK
        : NotificationType.INFORMATIONAL,
      category: input.category,
      tenantId,
      recipients: { userIds: [input.recipientUserId] },
      priority: input.priority ?? NotificationPriority.NORMAL,
      title: input.title,
      body: input.body,
      entity: input.entityId
        ? { type: input.entityType ?? 'unknown', id: input.entityId }
        : undefined,
      actionUrl: input.actionUrl,
      actionText: input.actionText,
      idempotencyKey: `${input.category}:${entityId}:${suffix}`,
    });
  }

  private async resolveTenantId(userId: string): Promise<string | undefined> {
    const tu = await prisma.tenantUser.findFirst({
      where: { userId, deletedAt: null },
      select: { tenantId: true },
    });
    return tu?.tenantId;
  }
}
