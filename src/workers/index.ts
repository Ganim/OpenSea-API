import { env } from '@/@env';
import { prisma } from '@/lib/prisma';
import { closeAllQueues } from '@/lib/queue';
import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { getImapIdleManager } from '@/services/email/imap-idle-manager';
import {
  startCalendarRemindersScheduler,
  stopCalendarRemindersScheduler,
} from './calendar-reminders-scheduler';
import {
  startEmailSyncScheduler,
  stopEmailSyncScheduler,
} from './email-sync-scheduler';
import {
  startEsocialBatchScheduler,
  stopEsocialBatchScheduler,
} from './esocial-batch-scheduler';
import {
  startHrDocExpiryScheduler,
  stopHrDocExpiryScheduler,
} from './hr-doc-expiry-scheduler';
import {
  startHrPayrollGenerationScheduler,
  stopHrPayrollGenerationScheduler,
} from './hr-payroll-generation-scheduler';
import {
  startHrVacationAccrualScheduler,
  stopHrVacationAccrualScheduler,
} from './hr-vacation-accrual-scheduler';
import {
  startNotificationsScheduler,
  stopNotificationsScheduler,
} from './notifications-scheduler';
import {
  startPaymentReconciliationScheduler,
  stopPaymentReconciliationScheduler,
} from './payment-reconciliation-scheduler';
import { startBadgePdfWorker } from './badge-pdf-worker';
import { startFolhaEspelhoBulkWorker } from './folha-espelho-bulk-worker';
import { startPunchEventsWorker } from './punch-events-worker';
import { startQrBatchWorker } from './qr-batch-worker';
import { startReceiptPdfWorker } from './receipt-pdf-worker';
import {
  scheduleCalendarRemindersRepeatable,
  startCalendarRemindersQueueWorker,
  unscheduleCalendarRemindersRepeatable,
} from './queues/calendar-reminders.queue';
import { startEmailSyncWorker } from './queues/email-sync.queue';
import { startEsocialBatchPollingWorker } from './queues/esocial-batch-polling.queue';
import {
  scheduleDocExpiryRepeatable,
  startDocExpiryQueueWorker,
  unscheduleDocExpiryRepeatable,
} from './queues/hr-doc-expiry.queue';
import {
  schedulePayrollGenerationRepeatable,
  startPayrollGenerationQueueWorker,
  unschedulePayrollGenerationRepeatable,
} from './queues/hr-payroll-generation.queue';
import {
  scheduleVacationAccrualRepeatable,
  startVacationAccrualQueueWorker,
  unscheduleVacationAccrualRepeatable,
} from './queues/hr-vacation-accrual.queue';
import { startNotificationWorker } from './queues/notification.queue';
import {
  schedulePaymentReconciliationRepeatable,
  startPaymentReconciliationQueueWorker,
  unschedulePaymentReconciliationRepeatable,
} from './queues/payment-reconciliation.queue';
import {
  scheduleScheduledNotificationsRepeatable,
  startScheduledNotificationsQueueWorker,
  unscheduleScheduledNotificationsRepeatable,
} from './queues/scheduled-notifications.queue';

let workersStarted = false;
let isShuttingDown = false;

/**
 * Start IMAP IDLE monitoring for all active email accounts.
 * Non-critical — failures are logged but don't prevent worker startup.
 */
async function startIdleMonitoring(): Promise<void> {
  const idleManager = getImapIdleManager();
  const cipher = new CredentialCipherService();

  // Get all active accounts across all tenants (same pattern as scheduler)
  const tenantIds = await prisma.emailAccount.findMany({
    where: { isActive: true },
    select: { tenantId: true },
    distinct: ['tenantId'],
  });

  const repo = new PrismaEmailAccountsRepository();
  const accounts = [];
  for (const { tenantId } of tenantIds) {
    const tenantAccounts = await repo.listActive(tenantId);
    accounts.push(...tenantAccounts);
  }

  let started = 0;
  for (const account of accounts) {
    try {
      const secret = cipher.decrypt(account.encryptedSecret);

      await idleManager.startMonitoring({
        id: account.id.toString(),
        tenantId: account.tenantId.toString(),
        imapConfig: {
          host: account.imapHost,
          port: account.imapPort,
          secure: account.imapSecure,
          username: account.username,
          secret,
          rejectUnauthorized: account.tlsVerify,
        },
      });
      started++;
    } catch (err) {
      console.error(
        `[Workers] Failed to start IDLE for account ${account.id.toString()}:`,
        err,
      );
    }
  }

  if (started > 0) {
    console.log(`[Workers] IDLE monitoring started for ${started} account(s)`);
  }
}

/**
 * Inicia todos os workers de fila
 */
export async function startAllWorkers(): Promise<void> {
  if (workersStarted) {
    console.log('[Workers] Workers already started');
    return;
  }

  console.log('[Workers] Starting all queue workers...');

  // BULLMQ_ENABLED gate: when false, skip every worker that polls Redis
  // (email-sync, notifications, esocial-batch-polling, punch-events,
  // qr-batch, badge-pdf). Prevents the entire worker fleet from hammering
  // Redis in a retry-storm when the Upstash quota is exhausted.
  if (env.BULLMQ_ENABLED) {
    startEmailSyncWorker();
    startNotificationWorker();
    startEsocialBatchPollingWorker();

    try {
      startPunchEventsWorker();
      console.log('[Workers] Punch events worker started');
    } catch (err) {
      console.error('[Workers] Failed to start punch events worker:', err);
    }

    try {
      startQrBatchWorker();
      console.log('[Workers] QR batch worker started');
    } catch (err) {
      console.error('[Workers] Failed to start QR batch worker:', err);
    }

    try {
      startBadgePdfWorker();
      console.log('[Workers] Badge PDF worker started');
    } catch (err) {
      console.error('[Workers] Failed to start Badge PDF worker:', err);
    }

    try {
      startReceiptPdfWorker();
      console.log(
        '[Workers] Receipt PDF worker started (Phase 06 / Plan 06-03)',
      );
    } catch (err) {
      console.error('[Workers] Failed to start Receipt PDF worker:', err);
    }

    try {
      startFolhaEspelhoBulkWorker();
      console.log(
        '[Workers] Folha Espelho bulk worker started (Phase 06 / Plan 06-04)',
      );
    } catch (err) {
      console.error(
        '[Workers] Failed to start Folha Espelho bulk worker:',
        err,
      );
    }
  } else {
    console.log(
      '[Workers] BULLMQ_ENABLED=false — skipping email-sync, notifications, esocial-batch-polling, punch-events, qr-batch, badge-pdf, receipt-pdf, folha-espelho-bulk workers',
    );
  }

  // Start the email sync scheduler (enqueues periodic sync jobs)
  try {
    await startEmailSyncScheduler();
  } catch (err) {
    console.error('[Workers] Failed to start email sync scheduler:', err);
  }

  // Start eSocial batch polling scheduler (non-critical)
  try {
    await startEsocialBatchScheduler();
  } catch (err) {
    console.error('[Workers] Failed to start eSocial batch scheduler:', err);
  }

  // Start IMAP IDLE real-time monitoring (non-critical)
  try {
    await startIdleMonitoring();
  } catch (err) {
    console.error('[Workers] Failed to start IDLE monitoring:', err);
  }

  // P3-05: scheduler fan-out — when BULLMQ_ENABLED=true, start the durable
  // BullMQ-backed worker + repeatable job for each scheduler. Otherwise fall
  // back to the legacy in-process setInterval scheduler so production keeps
  // working until the flag is rolled out. Each try/catch is isolated so one
  // bad scheduler does not prevent the others from booting.

  // Payment reconciliation (daily 02:00 UTC).
  if (env.BULLMQ_ENABLED) {
    try {
      startPaymentReconciliationQueueWorker();
      await schedulePaymentReconciliationRepeatable();
      console.log(
        '[Workers] Payment reconciliation queue worker started (BullMQ)',
      );
    } catch (err) {
      console.error(
        '[Workers] Failed to start payment reconciliation queue worker:',
        err,
      );
    }
  } else {
    try {
      await startPaymentReconciliationScheduler();
    } catch (err) {
      console.error(
        '[Workers] Failed to start payment reconciliation scheduler:',
        err,
      );
    }
  }

  // HR vacation accrual (monthly, day 1 at 02:00 UTC)
  if (env.BULLMQ_ENABLED) {
    try {
      startVacationAccrualQueueWorker();
      await scheduleVacationAccrualRepeatable();
      console.log(
        '[Workers] HR vacation accrual queue worker started (BullMQ)',
      );
    } catch (err) {
      console.error(
        '[Workers] Failed to start HR vacation accrual queue worker:',
        err,
      );
    }
  } else {
    try {
      await startHrVacationAccrualScheduler();
    } catch (err) {
      console.error(
        '[Workers] Failed to start HR vacation accrual scheduler:',
        err,
      );
    }
  }

  // HR document expiry (daily 08:00 UTC)
  if (env.BULLMQ_ENABLED) {
    try {
      startDocExpiryQueueWorker();
      await scheduleDocExpiryRepeatable();
      console.log('[Workers] HR doc expiry queue worker started (BullMQ)');
    } catch (err) {
      console.error(
        '[Workers] Failed to start HR doc expiry queue worker:',
        err,
      );
    }
  } else {
    try {
      await startHrDocExpiryScheduler();
    } catch (err) {
      console.error(
        '[Workers] Failed to start HR document expiry scheduler:',
        err,
      );
    }
  }

  // HR monthly payroll draft generation (monthly, day 25 at 03:00 UTC)
  if (env.BULLMQ_ENABLED) {
    try {
      startPayrollGenerationQueueWorker();
      await schedulePayrollGenerationRepeatable();
      console.log(
        '[Workers] HR payroll generation queue worker started (BullMQ)',
      );
    } catch (err) {
      console.error(
        '[Workers] Failed to start HR payroll generation queue worker:',
        err,
      );
    }
  } else {
    try {
      await startHrPayrollGenerationScheduler();
    } catch (err) {
      console.error(
        '[Workers] Failed to start HR payroll generation scheduler:',
        err,
      );
    }
  }

  // Calendar reminders (every 60s)
  if (env.BULLMQ_ENABLED) {
    try {
      startCalendarRemindersQueueWorker();
      await scheduleCalendarRemindersRepeatable();
      console.log('[Workers] Calendar reminders queue worker started (BullMQ)');
    } catch (err) {
      console.error(
        '[Workers] Failed to start calendar reminders queue worker:',
        err,
      );
    }
  } else {
    try {
      await startCalendarRemindersScheduler();
    } catch (err) {
      console.error(
        '[Workers] Failed to start calendar reminders scheduler:',
        err,
      );
    }
  }

  // Scheduled notifications (every 60s)
  if (env.BULLMQ_ENABLED) {
    try {
      startScheduledNotificationsQueueWorker();
      await scheduleScheduledNotificationsRepeatable();
      console.log(
        '[Workers] Scheduled notifications queue worker started (BullMQ)',
      );
    } catch (err) {
      console.error(
        '[Workers] Failed to start scheduled notifications queue worker:',
        err,
      );
    }
  } else {
    try {
      await startNotificationsScheduler();
    } catch (err) {
      console.error('[Workers] Failed to start notifications scheduler:', err);
    }
  }

  workersStarted = true;
  console.log('[Workers] All workers started successfully');
}

/**
 * Para todos os workers graciosamente
 */
export async function stopAllWorkers(): Promise<void> {
  console.log('[Workers] Stopping all queue workers...');

  // Stop IDLE monitoring first (closes persistent IMAP connections)
  await getImapIdleManager().stopAll();

  // Stop all schedulers (prevent new jobs from being enqueued)
  stopCalendarRemindersScheduler();
  stopEmailSyncScheduler();
  stopEsocialBatchScheduler();
  stopNotificationsScheduler();
  stopPaymentReconciliationScheduler();
  stopHrVacationAccrualScheduler();
  stopHrDocExpiryScheduler();
  stopHrPayrollGenerationScheduler();

  // P3-05: when running on the BullMQ path, also tear down every repeatable
  // schedule so a redeploy does not leave orphaned cron entries in Redis.
  if (env.BULLMQ_ENABLED) {
    const tearDowns: Array<[string, () => Promise<void>]> = [
      ['payment reconciliation', unschedulePaymentReconciliationRepeatable],
      ['vacation accrual', unscheduleVacationAccrualRepeatable],
      ['doc expiry', unscheduleDocExpiryRepeatable],
      ['payroll generation', unschedulePayrollGenerationRepeatable],
      ['calendar reminders', unscheduleCalendarRemindersRepeatable],
      ['scheduled notifications', unscheduleScheduledNotificationsRepeatable],
    ];

    for (const [label, teardown] of tearDowns) {
      try {
        await teardown();
      } catch (err) {
        console.error(
          `[Workers] Failed to unschedule ${label} repeatable:`,
          err,
        );
      }
    }
  }

  // Then close BullMQ queues and workers
  await closeAllQueues();
  workersStarted = false;
  console.log('[Workers] All workers stopped');
}

const SHUTDOWN_TIMEOUT_MS = 15_000;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[Workers] ${signal} received, shutting down...`);

  const shutdownTimer = setTimeout(() => {
    console.error(
      `[Workers] Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`,
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    await stopAllWorkers();
  } catch (err) {
    console.error('[Workers] Error during shutdown:', err);
  } finally {
    clearTimeout(shutdownTimer);
    process.exit(0);
  }
}

// Standalone entrypoint support: when this file is the process's main module
// (legacy Dockerfile.worker path), self-bootstrap the workers and register
// signal handlers. When imported by server.ts (co-located deployment), skip
// auto-start so the API server owns the lifecycle and signal handlers.
const isStandaloneEntrypoint =
  typeof process.argv[1] === 'string' &&
  (process.argv[1].endsWith('workers/index.js') ||
    process.argv[1].endsWith('workers\\index.js'));

if (isStandaloneEntrypoint) {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  startAllWorkers().catch((err) => {
    console.error('[Workers] Fatal error starting workers:', err);
    process.exit(1);
  });
}
