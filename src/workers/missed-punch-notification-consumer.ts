/**
 * Missed Punch Notification Consumer
 *
 * Phase 9 / Plan 09-04 — Wave 2 Task 1
 *
 * Processes PUNCH_EVENTS.MISSED_PUNCHES_DETECTED events and dispatches two types
 * of notifications:
 *
 * 1. **Manager Aggregated** (punch.missed_punch_manager): 1 notification per eligible
 *    manager, aggregating up to 5 employee names + "+N mais" when > 5 (D-23).
 *    Resolves managers via BFS hierarchy (Employee.supervisorId) + ApprovalDelegation
 *    + HR admin group (Phase 7-02).
 *
 * 2. **Employee Individual** (punch.missed_punch_employee): 1 notification per
 *    missed employee (D-21), reminding them to register or justify the absence.
 *
 * Architectural Decision (Plan 09-04 — Opção A): This file exports a pure processor
 * function `processMissedPunchNotifications(job)` that is consumed by the singleton
 * dispatcher `punch-events-worker.ts` (NOT a separate BullMQ worker). Avoids
 * multiplying Redis clients and maintains dispatcher as single translation point.
 *
 * Cross-tenant isolation: tenantId is faithfully propagated in all queries and
 * dispatches. resolveEligibleManagerUserIds enforces tenant scoping (Phase 7-02).
 */

import type { Job } from 'bullmq';

import type { PunchEventQueuePayload } from '@/lib/events/consumers/punch-events-queue-bridge';
import { PUNCH_EVENTS } from '@/lib/events/punch-events';
import type { PunchMissedPunchesDetectedData } from '@/lib/events/punch-events';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { notificationClient } from '@/modules/notifications/public/client';
import { resolveEligibleManagerUserIds } from '@/lib/websocket/hr-socket-scope';

const MAX_NAMES_IN_AGG = 5; // D-23: truncate to 5 names, show "+N mais" for remainder

/**
 * Processes a PUNCH_EVENTS.MISSED_PUNCHES_DETECTED event.
 *
 * Returns { processed, managerDispatches, employeeDispatches } counters for
 * observability (test assertion + logging).
 */
export async function processMissedPunchNotifications(
  job: Job<PunchEventQueuePayload>,
): Promise<{
  processed: true;
  managerDispatches: number;
  employeeDispatches: number;
}> {
  if (job.data.type !== PUNCH_EVENTS.MISSED_PUNCHES_DETECTED) {
    return { processed: true, managerDispatches: 0, employeeDispatches: 0 };
  }

  const data = job.data.data as PunchMissedPunchesDetectedData;
  const { tenantId, date } = data;

  logger.info(
    {
      jobId: job.id,
      eventId: job.data.eventId,
      tenantId,
      date,
      logCount: data.logIds.length,
    },
    '[MissedPunchNotificationConsumer] processing event',
  );

  // Fetch the full PunchMissedLog rows to get employee details
  const missedLogs = await prisma.punchMissedLog.findMany({
    where: { id: { in: data.logIds }, tenantId },
    select: {
      id: true,
      employeeId: true,
      employee: {
        select: {
          id: true,
          name: true,
          supervisorId: true,
          userId: true,
        },
      },
    },
  });

  if (missedLogs.length === 0) {
    logger.warn(
      { tenantId, logIds: data.logIds },
      '[MissedPunchNotificationConsumer] no logs found for notification',
    );
    return { processed: true, managerDispatches: 0, employeeDispatches: 0 };
  }

  // 1. Resolve managers for each employee and aggregate by manager
  const employeeManagerMap = new Map<
    string,
    { employee: (typeof missedLogs)[0]['employee']; managerUserIds: string[] }
  >();

  for (const log of missedLogs) {
    if (!log.employee) {
      logger.warn(
        { logId: log.id },
        '[MissedPunchNotificationConsumer] employee not found for log',
      );
      continue;
    }

    const managerUserIds = await resolveEligibleManagerUserIds(
      tenantId,
      log.employeeId,
    );

    employeeManagerMap.set(log.employeeId, {
      employee: log.employee,
      managerUserIds,
    });
  }

  // Aggregate employees by manager
  const aggByManager = new Map<string, (typeof missedLogs)[0]['employee'][]>();
  for (const { employee, managerUserIds } of employeeManagerMap.values()) {
    for (const mgrUserId of managerUserIds) {
      if (!aggByManager.has(mgrUserId)) {
        aggByManager.set(mgrUserId, []);
      }
      aggByManager.get(mgrUserId)!.push(employee);
    }
  }

  // 2. Dispatch 1 aggregated notification per manager (D-23: max 5 names + "+N mais")
  const managerDispatches = await Promise.allSettled(
    Array.from(aggByManager.entries()).map(([mgrUserId, employees]) => {
      const sample = employees.slice(0, MAX_NAMES_IN_AGG);
      const remainder = Math.max(0, employees.length - MAX_NAMES_IN_AGG);

      const namesText =
        sample.map((e) => e.name).join(', ') +
        (remainder > 0 ? ` e mais ${remainder}` : '');

      return notificationClient.dispatch({
        tenantId,
        category: 'punch.missed_punch_manager',
        recipients: { kind: 'user', userId: mgrUserId },
        type: 'LINK',
        title: `${employees.length} funcionário(s) sem batida em ${date}`,
        body: `Sem batida: ${namesText}`,
        actionUrl: '/hr/punch/missing',
        idempotencyKey: `missed-punch-manager:${mgrUserId}:${date}`,
        metadata: {
          tenantId,
          date,
          employeeCount: employees.length,
        },
      });
    }),
  );

  const managerDispatchCount = managerDispatches.filter(
    (r) => r.status === 'fulfilled',
  ).length;

  // Log failures for observability
  managerDispatches.forEach((result, idx) => {
    if (result.status === 'rejected') {
      const managers = Array.from(aggByManager.keys());
      logger.warn(
        { reason: result.reason, managerUserId: managers[idx] },
        '[MissedPunchNotificationConsumer] manager dispatch failed (isolation—continuing)',
      );
    }
  });

  // 3. Dispatch 1 individual notification per missed employee (D-21)
  // Filter: only dispatch to employees with user accounts
  const employeesToNotify = missedLogs.filter((log) => {
    if (!log.employee?.userId) {
      logger.debug(
        { employeeId: log.employeeId },
        '[MissedPunchNotificationConsumer] employee has no user account—skipping',
      );
      return false;
    }
    return true;
  });

  const employeeDispatches = await Promise.allSettled(
    employeesToNotify.map((log) =>
      notificationClient.dispatch({
        tenantId,
        category: 'punch.missed_punch_employee',
        recipients: { kind: 'user', userId: log.employee!.userId! },
        type: 'LINK',
        title: 'Você não bateu ponto hoje',
        body: `Lembrete: você não registrou batida em ${date}. Acesse o app para registrar ou justificar.`,
        actionUrl: '/punch',
        idempotencyKey: `missed-punch-employee:${log.employeeId}:${date}`,
        metadata: {
          tenantId,
          date,
          employeeId: log.employeeId,
        },
      }),
    ),
  );

  const employeeDispatchCount = employeeDispatches.filter(
    (r) => r.status === 'fulfilled',
  ).length;

  // Log failures for observability
  employeeDispatches.forEach((result, idx) => {
    if (result.status === 'rejected') {
      const logs = missedLogs;
      logger.warn(
        { reason: result.reason, employeeId: logs[idx]?.employeeId },
        '[MissedPunchNotificationConsumer] employee dispatch failed (isolation—continuing)',
      );
    }
  });

  logger.info(
    {
      jobId: job.id,
      managerDispatches: managerDispatchCount,
      employeeDispatches: employeeDispatchCount,
    },
    '[MissedPunchNotificationConsumer] event processed',
  );

  return {
    processed: true,
    managerDispatches: managerDispatchCount,
    employeeDispatches: employeeDispatchCount,
  };
}
