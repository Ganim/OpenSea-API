import { prisma } from '@/lib/prisma';
import { closeAllQueues } from '@/lib/queue';
import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { getImapIdleManager } from '@/services/email/imap-idle-manager';
import { stopCalendarRemindersScheduler } from './calendar-reminders-scheduler';
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
import { stopNotificationsScheduler } from './notifications-scheduler';
import {
  startPaymentReconciliationScheduler,
  stopPaymentReconciliationScheduler,
} from './payment-reconciliation-scheduler';
import { startEmailSyncWorker } from './queues/email-sync.queue';
import { startEsocialBatchPollingWorker } from './queues/esocial-batch-polling.queue';
import { startNotificationWorker } from './queues/notification.queue';

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

  startEmailSyncWorker();
  startNotificationWorker();
  startEsocialBatchPollingWorker();

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

  // Start payment reconciliation scheduler (daily 02:00 UTC)
  try {
    await startPaymentReconciliationScheduler();
  } catch (err) {
    console.error(
      '[Workers] Failed to start payment reconciliation scheduler:',
      err,
    );
  }

  // Start HR vacation accrual scheduler (monthly, day 1 at 02:00 UTC)
  try {
    await startHrVacationAccrualScheduler();
  } catch (err) {
    console.error(
      '[Workers] Failed to start HR vacation accrual scheduler:',
      err,
    );
  }

  // Start HR document expiry scheduler (daily 08:00 UTC)
  try {
    await startHrDocExpiryScheduler();
  } catch (err) {
    console.error(
      '[Workers] Failed to start HR document expiry scheduler:',
      err,
    );
  }

  // Start HR monthly payroll draft generation scheduler (monthly, day 25 at 03:00 UTC)
  try {
    await startHrPayrollGenerationScheduler();
  } catch (err) {
    console.error(
      '[Workers] Failed to start HR payroll generation scheduler:',
      err,
    );
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

// Graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start workers when this entrypoint runs (Dockerfile.worker: node build/workers/index.js)
startAllWorkers().catch((err) => {
  console.error('[Workers] Fatal error starting workers:', err);
  process.exit(1);
});
