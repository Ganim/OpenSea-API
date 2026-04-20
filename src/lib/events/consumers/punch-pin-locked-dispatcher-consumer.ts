/**
 * Punch → Notifications bridge for PIN lockout events (Phase 5, D-11).
 *
 * Listens to `punch.pin.locked` domain events (emitted when an employee
 * fails 5 consecutive PIN attempts in the kiosk) and dispatches an
 * ACTIONABLE notification of category `punch.pin_locked` to every user
 * with the `hr.punch-devices.admin` permission in the tenant. Admins can
 * acknowledge the lockout, trigger a manual unlock, or just observe for
 * fraud patterns.
 *
 * Body copy is deliberately concise and carries NO PIN value or per-attempt
 * details (T-PIN-02: information-disclosure mitigation — do not aid offline
 * brute-force).
 *
 * Idempotency key combines employeeId + lockedUntil so retries of the same
 * lockout do not spam admins, but a NEW lockout (different lockedUntil)
 * produces a new notification.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import type { PunchPinLockedData } from '../punch-events';
import { PUNCH_EVENTS } from '../punch-events';

import {
  notificationClient,
  NotificationType,
} from '@/modules/notifications/public';

// Lazy logger — avoid @env initialization in unit tests.
let _logger: {
  error: (obj: unknown, msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = {
        error: (obj, msg) => console.error(msg, obj),
      };
    }
  }
  return _logger!;
}

function minutesUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 60_000));
}

export const punchPinLockedDispatcherConsumer: EventConsumer = {
  consumerId: 'punch.pin-locked-dispatcher',
  moduleId: 'punch',
  subscribesTo: [PUNCH_EVENTS.PIN_LOCKED],

  async handle(event: DomainEvent): Promise<void> {
    try {
      const data = event.data as unknown as PunchPinLockedData;
      const minutes = minutesUntil(data.lockedUntil);

      await notificationClient.dispatch({
        type: NotificationType.ACTIONABLE,
        category: 'punch.pin_locked',
        tenantId: event.tenantId,
        recipients: { permission: 'hr.punch-devices.admin' },
        title: `PIN de ponto bloqueado: ${data.employeeName}`,
        // T-PIN-02: intentionally omit PIN value and per-attempt details.
        body: `5 tentativas inválidas registradas. Desbloqueio automático em ${minutes} min.`,
        idempotencyKey: `punch:pin-locked:${data.employeeId}:${data.lockedUntil}`,
        entity: { type: 'employee', id: data.employeeId },
        // Actionable needs at least one action + callback URL per the type.
        actions: [
          {
            key: 'acknowledge',
            label: 'Ciente',
            style: 'secondary',
          },
          {
            key: 'unlock_now',
            label: 'Desbloquear agora',
            style: 'primary',
          },
        ],
        callbackUrl: `/v1/hr/employees/${data.employeeId}/unlock-punch-pin`,
        metadata: {
          failedAttempts: data.failedAttempts,
          lockedUntil: data.lockedUntil,
        },
      });
    } catch (err) {
      getLogger().error(
        {
          eventId: event.id,
          error: err instanceof Error ? err.message : String(err),
        },
        '[PunchPinLockedDispatcher] Falha ao despachar notificação de bloqueio',
      );
      throw err; // let typedEventBus retry with exponential backoff
    }
  },
};
