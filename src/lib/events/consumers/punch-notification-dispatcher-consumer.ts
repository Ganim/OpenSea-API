/**
 * Punch → Notifications bridge consumer (REAL).
 *
 * This is the only real consumer in Plan 04-05 — the other three (payroll,
 * timebank, esocial) are stubs that land in later phases. It translates
 * typed `punch.*` domain events into `notificationClient.dispatch(...)`
 * calls using the categories declared in `punch.manifest.ts`:
 *
 * - `punch.time-entry.created` → dispatch INFORMATIONAL `punch.registered`
 *   to the employee (resolved via `Employee → User`).
 * - `punch.approval.requested` → dispatch APPROVAL `punch.approval_requested`
 *   to anyone with the `hr.punch-approvals.admin` permission.
 *
 * Idempotency keys are scoped to the underlying domain entity so consumer
 * retries never produce duplicate notifications:
 *   `punch:registered:{timeEntryId}` and `punch:approval:{approvalId}`.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { PUNCH_EVENTS } from '../punch-events';
import type {
  PunchApprovalRequestedData,
  PunchTimeEntryCreatedData,
} from '../punch-events';

import { prisma } from '@/lib/prisma';
import {
  notificationClient,
  NotificationType,
} from '@/modules/notifications/public';

// Lazy logger to avoid @env initialization in unit tests
let _logger: {
  info: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = {
        info: (obj, msg) => console.log(msg, obj),
        warn: (obj, msg) => console.warn(msg, obj),
        error: (obj, msg) => console.error(msg, obj),
      };
    }
  }
  return _logger!;
}

/**
 * Resolve the `User.id` that should receive the "batida registrada"
 * notification given the `Employee.id`. Returns `null` when the employee
 * has no linked user (e.g., terminal-only batida worker) — in that case
 * we silently skip the notification rather than fail the whole event.
 */
async function resolveEmployeeUserId(
  employeeId: string,
  tenantId: string,
): Promise<string | null> {
  try {
    const emp = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: { userId: true },
    });
    return emp?.userId ?? null;
  } catch (err) {
    getLogger().warn(
      { employeeId, tenantId, error: err },
      '[PunchNotificationDispatcherConsumer] Falha ao resolver userId do funcionário',
    );
    return null;
  }
}

function formatEntryType(
  entryType: PunchTimeEntryCreatedData['entryType'],
): string {
  switch (entryType) {
    case 'CLOCK_IN':
      return 'entrada';
    case 'CLOCK_OUT':
      return 'saída';
    case 'BREAK_START':
      return 'início de intervalo';
    case 'BREAK_END':
      return 'fim de intervalo';
    default:
      return entryType;
  }
}

export const punchNotificationDispatcherConsumer: EventConsumer = {
  consumerId: 'punch.notification-dispatcher',
  moduleId: 'punch',
  subscribesTo: [
    PUNCH_EVENTS.TIME_ENTRY_CREATED,
    PUNCH_EVENTS.APPROVAL_REQUESTED,
  ],

  async handle(event: DomainEvent): Promise<void> {
    try {
      if (event.type === PUNCH_EVENTS.TIME_ENTRY_CREATED) {
        const data = event.data as unknown as PunchTimeEntryCreatedData;
        const userId = await resolveEmployeeUserId(
          data.employeeId,
          event.tenantId,
        );
        if (!userId) {
          getLogger().info(
            {
              eventId: event.id,
              employeeId: data.employeeId,
              tenantId: event.tenantId,
            },
            '[PunchNotificationDispatcherConsumer] Funcionário sem userId; pulando notificação punch.registered',
          );
          return;
        }
        await notificationClient.dispatch({
          type: NotificationType.INFORMATIONAL,
          category: 'punch.registered',
          tenantId: event.tenantId,
          recipients: { userIds: [userId] },
          title: 'Ponto registrado',
          body: `Sua batida (${formatEntryType(data.entryType)}) foi registrada às ${new Date(data.timestamp).toLocaleTimeString('pt-BR')}.`,
          idempotencyKey: `punch:registered:${data.timeEntryId}`,
          entity: { type: 'time_entry', id: data.timeEntryId },
          metadata: {
            entryType: data.entryType,
            hasApproval: data.hasApproval,
            punchDeviceId: data.punchDeviceId,
          },
        });
        return;
      }

      if (event.type === PUNCH_EVENTS.APPROVAL_REQUESTED) {
        const data = event.data as unknown as PunchApprovalRequestedData;
        await notificationClient.dispatch({
          type: NotificationType.APPROVAL,
          category: 'punch.approval_requested',
          tenantId: event.tenantId,
          recipients: { permission: 'hr.punch-approvals.admin' },
          title: 'Aprovação de batida pendente',
          body: `Batida do funcionário precisa de aprovação (motivo: ${data.reason}).`,
          idempotencyKey: `punch:approval:${data.approvalId}`,
          entity: { type: 'punch_approval', id: data.approvalId },
          callbackUrl: `/v1/hr/punch-approvals/${data.approvalId}/resolve`,
          metadata: {
            reason: data.reason,
            timeEntryId: data.timeEntryId,
            details: data.details ?? {},
          },
        });
      }
    } catch (err) {
      getLogger().error(
        {
          eventId: event.id,
          type: event.type,
          error: err instanceof Error ? err.message : String(err),
        },
        '[PunchNotificationDispatcherConsumer] Falha ao despachar notificação',
      );
      throw err; // let typedEventBus retry (exponential backoff, DLQ on exhaustion)
    }
  },
};
