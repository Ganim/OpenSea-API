/**
 * Punch → Notifications bridge for QR rotation completion events (Phase 5, D-14).
 *
 * Listens to `punch.qr.rotation.completed` domain events (emitted by the
 * `rotate-qr-batch` BullMQ worker once a bulk rotation job finishes) and
 * dispatches an INFORMATIONAL notification of category
 * `punch.qr_rotation.completed`.
 *
 * Recipient policy (T-QR-01 information-disclosure mitigation):
 *   - Primary: the admin who invoked the rotation (`invokedByUserId`).
 *   - Secondary (broadcast): only when `processed > 50` — i.e., true bulk
 *     operations — also notify every user with the
 *     `hr.punch-devices.admin` permission. Low-volume individual rotations
 *     do NOT fan out to the whole admin set (avoids noise + spam).
 *
 * The boundary is strictly `processed > 50`; exactly 50 remains single-
 * recipient so the policy has a deterministic threshold for tests.
 *
 * Idempotency key is scoped to the jobId so retries of the same completion
 * event never produce duplicate notifications.
 */

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import type { PunchQrRotationCompletedData } from '../punch-events';
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

/** Threshold above which we also broadcast to every admin (T-QR-01). */
const BULK_BROADCAST_THRESHOLD = 50;

function buildTitle(): string {
  return 'Rotação de QR concluída';
}

function buildBody(data: PunchQrRotationCompletedData): string {
  const { processed, total, bulkPdfDownloadUrl } = data;
  const base = `${processed} de ${total} funcionário(s) rotacionado(s).`;
  return bulkPdfDownloadUrl
    ? `${base} PDF consolidado disponível para download.`
    : base;
}

export const punchQrRotationCompletedDispatcherConsumer: EventConsumer = {
  consumerId: 'punch.qr-rotation-completed-dispatcher',
  moduleId: 'punch',
  subscribesTo: [PUNCH_EVENTS.QR_ROTATION_COMPLETED],

  async handle(event: DomainEvent): Promise<void> {
    try {
      const data = event.data as unknown as PunchQrRotationCompletedData;

      const idempotencyBase = `punch:qr-rotation-completed:${data.jobId}`;
      const title = buildTitle();
      const body = buildBody(data);
      const metadata = {
        jobId: data.jobId,
        processed: data.processed,
        total: data.total,
        generatedPdfs: data.generatedPdfs,
        bulkPdfDownloadUrl: data.bulkPdfDownloadUrl,
      };
      const entity = { type: 'qr_rotation_job' as const, id: data.jobId };

      // Primary dispatch — always fires, targeting the admin who invoked.
      await notificationClient.dispatch({
        type: NotificationType.INFORMATIONAL,
        category: 'punch.qr_rotation.completed',
        tenantId: event.tenantId,
        recipients: { userIds: [data.invokedByUserId] },
        title,
        body,
        idempotencyKey: idempotencyBase,
        entity,
        metadata,
      });

      // Secondary broadcast — only for true bulk operations (> 50).
      // T-QR-01: suppress individual-rotation broadcasts to avoid spam.
      if (data.processed > BULK_BROADCAST_THRESHOLD) {
        await notificationClient.dispatch({
          type: NotificationType.INFORMATIONAL,
          category: 'punch.qr_rotation.completed',
          tenantId: event.tenantId,
          recipients: { permission: 'hr.punch-devices.admin' },
          title,
          body,
          // Different suffix so the dedup layer does not collide with the
          // invoker-scoped dispatch above.
          idempotencyKey: `${idempotencyBase}:broadcast`,
          entity,
          metadata,
        });
      }
    } catch (err) {
      getLogger().error(
        {
          eventId: event.id,
          error: err instanceof Error ? err.message : String(err),
        },
        '[PunchQrRotationCompletedDispatcher] Falha ao despachar notificação de conclusão',
      );
      throw err; // let typedEventBus retry with exponential backoff
    }
  },
};
