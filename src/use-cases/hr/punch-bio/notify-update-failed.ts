/**
 * NotifyUpdateFailedUseCase — Plan 10-06 Task 6.4.
 *
 * Called when a paired Punch-Agent fails to auto-update. Resolves the tenant
 * admins with `hr.bio.admin` permission and dispatches a
 * `punch.agent_update_failed` ACTIONABLE notification to each of them.
 *
 * Pattern: compute-daily-digest.ts (Phase 7 / Plan 07-05a).
 *
 * Security:
 *   - T-10-06-03: message is already truncated to 200 chars by the caller
 *     (updater.ts + notifications.ts). Enforced again here via Math.min guard.
 *   - T-10-06-05: caller already authenticated via verifyPunchDeviceToken.
 *
 * Idempotency key: `punch.agent_update_failed:{deviceId}:{truncated-message-hash}`
 *   – bounded per agent; dispatcher deduplicates across retries.
 */
import type { DispatchNotificationInput } from '@/modules/notifications/public/events';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '@/modules/notifications/public/types';
import { createHash } from 'node:crypto';

// ── Shape interfaces (testable without real Prisma) ───────────────────────────

export interface NotifyUpdateFailedPrisma {
  permissionGroup: {
    findMany(args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
    }): Promise<Array<{ users: Array<{ userId: string | null }> }>>;
  };
  punchDevice: {
    findUnique(args: {
      where: { id: string };
      select: Record<string, unknown>;
    }): Promise<{ name: string } | null>;
  };
}

export interface NotifyUpdateFailedNotificationClient {
  dispatch(
    input: DispatchNotificationInput,
  ): Promise<{ notificationIds: string[] }>;
}

export interface NotifyUpdateFailedInput {
  tenantId: string;
  deviceId: string;
  message: string;
}

export interface NotifyUpdateFailedResult {
  ok: true;
  dispatchedCount: number;
  recipientUserIds: string[];
}

// ── Use case ──────────────────────────────────────────────────────────────────

export class NotifyUpdateFailedUseCase {
  constructor(
    private prisma: NotifyUpdateFailedPrisma,
    private notificationClient: NotifyUpdateFailedNotificationClient,
  ) {}

  async execute(
    input: NotifyUpdateFailedInput,
  ): Promise<NotifyUpdateFailedResult> {
    const { tenantId, deviceId, message } = input;

    // T-10-06-03: enforce 200-char cap (belt-and-suspenders)
    const safeMessage = message.slice(0, 200);

    // Resolve device label for notification body
    const device = await this.prisma.punchDevice.findUnique({
      where: { id: deviceId },
      select: { name: true },
    });
    const deviceLabel = device?.name ?? deviceId;

    // Resolve recipients: users with hr.bio.admin permission on this tenant.
    // PermissionGroupPermission has a `permission` relation → filter via nested
    // `permission: { code: ... }` (NOT direct `code` on the pivot — ADR-024).
    const groups = await this.prisma.permissionGroup.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
        permissions: {
          some: { permission: { code: 'hr.bio.admin' } },
        },
      },
      select: {
        users: { select: { userId: true } },
      },
    });

    const userIds = Array.from(
      new Set(
        groups
          .flatMap((g) => g.users.map((u) => u.userId))
          .filter((id): id is string => id !== null),
      ),
    );

    if (userIds.length === 0) {
      // No admins to notify — log and return gracefully.
      return { ok: true, dispatchedCount: 0, recipientUserIds: [] };
    }

    // Idempotency key: scoped per device + message content (short hash)
    const msgHash = createHash('sha256')
      .update(safeMessage)
      .digest('hex')
      .slice(0, 12);
    const idempotencyKey = `punch.agent_update_failed:${deviceId}:${msgHash}`;

    const dispatched: string[] = [];

    for (const userId of userIds) {
      try {
        await this.notificationClient.dispatch({
          type: NotificationType.ACTIONABLE,
          category: 'punch.agent_update_failed',
          tenantId,
          recipients: { userIds: [userId] },
          title: 'Falha de auto-update do Punch-Agent',
          body: `Dispositivo "${deviceLabel}" não conseguiu se atualizar. Erro: ${safeMessage}`,
          priority: NotificationPriority.HIGH,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          idempotencyKey: `${idempotencyKey}:${userId}`,
          entity: { type: 'punch_device', id: deviceId },
          // ACTIONABLE requires callbackUrl + actions — use empty action (view only)
          callbackUrl: `/v1/hr/punch-devices/${deviceId}`,
          actions: [
            {
              label: 'Ver dispositivo',
              actionType: 'link',
              url: `/hr/punch/health`,
            },
          ],
        } as unknown as DispatchNotificationInput);
        dispatched.push(userId);
      } catch {
        // Dispatch failure for one recipient must not block others (fail-open).
      }
    }

    return {
      ok: true,
      dispatchedCount: dispatched.length,
      recipientUserIds: dispatched,
    };
  }
}
