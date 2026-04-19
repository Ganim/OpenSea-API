import { prisma } from '@/lib/prisma';
import {
  notificationClient,
  NotificationPriority,
  NotificationType,
} from '@/modules/notifications/public';
import type { Request } from '@/entities/requests/request';

/**
 * Category codes — MUST match `src/modules/notifications/manifests/requests.manifest.ts`.
 * Typed so a typo becomes a compile error instead of a runtime failure.
 */
export type RequestNotificationCategory =
  | 'requests.created'
  | 'requests.assigned'
  | 'requests.reassigned'
  | 'requests.unassigned'
  | 'requests.commented'
  | 'requests.info_requested'
  | 'requests.info_provided'
  | 'requests.in_progress'
  | 'requests.completed'
  | 'requests.cancelled'
  | 'requests.sla_warning'
  | 'requests.sla_breached'
  | 'requests.approval_pending'
  | 'requests.approval_approved'
  | 'requests.approval_rejected';

export interface DispatchRequestNotificationInput {
  recipientUserId: string;
  category: RequestNotificationCategory;
  request: Request;
  title: string;
  body: string;
  /** Used to build idempotencyKey together with category + request id. */
  dedupeSuffix?: string;
  tenantId?: string;
  priorityOverride?: NotificationPriority;
  actionUrlSuffix?: string;
  actionText?: string;
}

export interface RequestNotifier {
  dispatch(input: DispatchRequestNotificationInput): Promise<void>;
}

function mapPriority(requestPriority: string): NotificationPriority {
  switch (requestPriority) {
    case 'URGENT':
      return NotificationPriority.URGENT;
    case 'HIGH':
      return NotificationPriority.HIGH;
    case 'LOW':
      return NotificationPriority.LOW;
    default:
      return NotificationPriority.NORMAL;
  }
}

/**
 * Production notifier. Looks up the recipient's tenantId when not provided
 * and dispatches through the notifications v2 SDK.
 */
export class NotificationClientRequestNotifier implements RequestNotifier {
  async dispatch(input: DispatchRequestNotificationInput): Promise<void> {
    const tenantId =
      input.tenantId ??
      (
        await prisma.tenantUser.findFirst({
          where: { userId: input.recipientUserId, deletedAt: null },
          select: { tenantId: true },
        })
      )?.tenantId;

    if (!tenantId) return; // recipient not scoped to any tenant — drop silently

    const requestId = input.request.id.toString();
    const suffix = input.dedupeSuffix ?? input.recipientUserId;
    const actionUrl = `/requests/${requestId}${input.actionUrlSuffix ?? ''}`;

    await notificationClient.dispatch({
      type: NotificationType.LINK,
      category: input.category,
      tenantId,
      recipients: { userIds: [input.recipientUserId] },
      priority: input.priorityOverride ?? mapPriority(input.request.priority),
      title: input.title,
      body: input.body,
      entity: { type: 'request', id: requestId },
      actionUrl,
      actionText: input.actionText ?? 'Ver solicitação',
      idempotencyKey: `${input.category}:${requestId}:${suffix}`,
    });
  }
}
