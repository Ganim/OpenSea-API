/**
 * Face Match Fail 3x Notification Consumer
 *
 * Phase 9 / Plan 09-04 — Wave 2 Task 2
 *
 * Processes PUNCH_EVENTS.FACE_MATCH_FAIL_3X events and dispatches an immediate
 * ACTIONABLE push notification to eligible managers (D-11).
 *
 * When an employee accumulates 3 consecutive face match failures within a 60-minute
 * sliding window, the ExecutePunchUseCase (Plan 09-02) emits this event. The consumer
 * resolves eligible managers via BFS hierarchy + ApprovalDelegation + HR admin group
 * (Phase 7-02) and dispatches punch.face_match_alert with actionUrl to review the
 * approval in the audit interface.
 *
 * Architectural Decision (Plan 09-04 — Opção A): Like missed-punch-notification-consumer,
 * this file exports a pure processor `processFaceMatchFail3xNotification(job)` that is
 * consumed by the singleton dispatcher `punch-events-worker.ts` (NOT a separate worker).
 *
 * Cross-tenant isolation: tenantId is scoped in all queries and dispatches.
 */

import type { Job } from 'bullmq';

import type { PunchEventQueuePayload } from '@/lib/events/consumers/punch-events-queue-bridge';
import { PUNCH_EVENTS } from '@/lib/events/punch-events';
import type { PunchFaceMatchFail3xData } from '@/lib/events/punch-events';
import { logger } from '@/lib/logger';
import { notificationClient } from '@/modules/notifications/public/client';
import { resolveEligibleManagerUserIds } from '@/lib/websocket/hr-socket-scope';

/**
 * Processes a PUNCH_EVENTS.FACE_MATCH_FAIL_3X event.
 *
 * Returns { processed, dispatched } count for observability (test assertion + logging).
 */
export async function processFaceMatchFail3xNotification(
  job: Job<PunchEventQueuePayload>,
): Promise<{
  processed: true;
  dispatched: number;
}> {
  if (job.data.type !== PUNCH_EVENTS.FACE_MATCH_FAIL_3X) {
    return { processed: true, dispatched: 0 };
  }

  const data = job.data.data as PunchFaceMatchFail3xData;
  const { tenantId, approvalId, employeeId, employeeName, failureCount } = data;

  logger.info(
    {
      jobId: job.id,
      eventId: job.data.eventId,
      tenantId,
      approvalId,
      employeeId,
      failureCount,
    },
    '[FaceMatchFail3xConsumer] processing event',
  );

  // Resolve eligible managers for this employee (BFS hierarchy + delegations + HR admin)
  const managerUserIds = await resolveEligibleManagerUserIds(
    tenantId,
    employeeId,
  );

  if (managerUserIds.length === 0) {
    logger.warn(
      {
        jobId: job.id,
        eventId: job.data.eventId,
        employeeId,
        tenantId,
      },
      '[FaceMatchFail3xConsumer] no eligible managers found — skipping notification',
    );
    return { processed: true, dispatched: 0 };
  }

  // Dispatch ACTIONABLE push notification to each eligible manager
  const results = await Promise.allSettled(
    managerUserIds.map((mgrUserId) =>
      notificationClient.dispatch({
        tenantId,
        category: 'punch.face_match_alert',
        recipients: { kind: 'user', userId: mgrUserId },
        type: 'ACTIONABLE',
        title: 'Alerta: 3 falhas consecutivas de face match',
        body: `Funcionário ${employeeName} teve ${failureCount} falhas de face match em 60min — batida em análise.`,
        actionUrl: `/hr/punch/audit?id=${approvalId}`,
        idempotencyKey: `face-match-alert:${approvalId}:${mgrUserId}`,
        metadata: {
          approvalId,
          employeeId,
          failureCount,
        },
      }),
    ),
  );

  const dispatchedCount = results.filter(
    (r) => r.status === 'fulfilled',
  ).length;

  // Log failures for observability
  results.forEach((result, idx) => {
    if (result.status === 'rejected') {
      logger.warn(
        { reason: result.reason, managerUserId: managerUserIds[idx] },
        '[FaceMatchFail3xConsumer] dispatch failed (isolation—continuing)',
      );
    }
  });

  logger.info(
    {
      jobId: job.id,
      dispatchedCount,
      totalManagers: managerUserIds.length,
    },
    '[FaceMatchFail3xConsumer] event processed',
  );

  return { processed: true, dispatched: dispatchedCount };
}
