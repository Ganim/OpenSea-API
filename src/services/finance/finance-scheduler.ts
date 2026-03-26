import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { makeProcessOverdueEscalationsUseCase } from '@/use-cases/finance/escalations/factories/make-process-overdue-escalations-use-case';
import { makeGenerateRecurringBatchUseCase } from '@/use-cases/finance/recurring/factories/make-generate-recurring-batch';
import { makeSyncBankTransactionsUseCase } from '@/use-cases/finance/bank-connections/factories/make-sync-bank-transactions-use-case';

const LOG_PREFIX = '[FinanceScheduler]';

/**
 * Interval constants.
 *
 * The scheduler checks every minute whether a job is due.
 * Each job has its own interval expressed in milliseconds.
 */
const TICK_INTERVAL_MS = 60_000; // 1 minute
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface ScheduledJob {
  name: string;
  /** Target hour (0-23) in local time. Null = interval-based only. */
  targetHour: number | null;
  /** Minimum milliseconds between executions. */
  intervalMs: number;
  /** Timestamp of last successful execution start. */
  lastRunAt: number;
  /** The actual work to perform. */
  execute: () => Promise<void>;
}

/**
 * Finance Scheduler — runs periodic finance jobs in-process.
 *
 * Follows the same pattern as WorkflowScheduler and InsightScheduler:
 * - setInterval tick (no external dependencies like node-cron)
 * - Concurrency guard (skip tick if previous is still running)
 * - Singleton with start/stop lifecycle
 *
 * Jobs:
 * 1. Process Overdue Escalations — daily at ~08:00
 * 2. Generate Recurring Entries   — daily at ~06:00
 * 3. Sync Bank Transactions       — every 4 hours
 */
export class FinanceScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private jobs: ScheduledJob[] = [];

  constructor() {
    this.jobs = [
      {
        name: 'generate-recurring-entries',
        targetHour: 6,
        intervalMs: TWENTY_FOUR_HOURS_MS,
        lastRunAt: 0,
        execute: this.generateRecurringEntries.bind(this),
      },
      {
        name: 'process-overdue-escalations',
        targetHour: 8,
        intervalMs: TWENTY_FOUR_HOURS_MS,
        lastRunAt: 0,
        execute: this.processOverdueEscalations.bind(this),
      },
      {
        name: 'sync-bank-transactions',
        targetHour: null,
        intervalMs: FOUR_HOURS_MS,
        lastRunAt: 0,
        execute: this.syncBankTransactions.bind(this),
      },
    ];
  }

  start(): void {
    if (this.intervalId) {
      console.log(`${LOG_PREFIX} Already running`);
      return;
    }

    console.log(`${LOG_PREFIX} Starting (tick interval: 60s)`);
    console.log(
      `${LOG_PREFIX} Jobs: ${this.jobs.map((j) => j.name).join(', ')}`,
    );

    this.intervalId = setInterval(() => {
      this.tick().catch((err) => {
        console.error(`${LOG_PREFIX} Tick error:`, err);
      });
    }, TICK_INTERVAL_MS);

    // Do NOT run immediately on start — daily jobs should wait for their
    // scheduled hour. The bank sync job will fire after its first interval
    // elapses (4 hours from server start).
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`${LOG_PREFIX} Stopped`);
    }
  }

  /**
   * Single tick: evaluate each job and run if due.
   */
  private async tick(): Promise<void> {
    if (this.isRunning) {
      return; // Prevent concurrent ticks
    }

    this.isRunning = true;

    try {
      const now = Date.now();
      const currentHour = new Date().getHours();

      for (const job of this.jobs) {
        const elapsed = now - job.lastRunAt;

        // Skip if minimum interval hasn't passed
        if (elapsed < job.intervalMs) {
          continue;
        }

        // For hour-targeted jobs, only run if we're in the target hour
        if (job.targetHour !== null && currentHour !== job.targetHour) {
          continue;
        }

        job.lastRunAt = now;
        const jobStartTime = Date.now();

        try {
          logger.info(`${LOG_PREFIX} [${job.name}] Starting`);
          await job.execute();
          const jobElapsedMs = Date.now() - jobStartTime;
          logger.info(
            { elapsedMs: jobElapsedMs },
            `${LOG_PREFIX} [${job.name}] Completed`,
          );
        } catch (jobError) {
          const errorMessage =
            jobError instanceof Error ? jobError.message : String(jobError);
          logger.error(
            { error: jobError, elapsedMs: Date.now() - jobStartTime },
            `${LOG_PREFIX} [${job.name}] Failed: ${errorMessage}`,
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  // ─── Job Implementations ─────────────────────────────────────────────

  /**
   * Generate recurring finance entries for all active tenants.
   * Generates entries due within the next 7 days.
   */
  private async generateRecurringEntries(): Promise<void> {
    const activeTenantIds = await this.getActiveTenantIds();

    if (activeTenantIds.length === 0) {
      logger.info(
        `${LOG_PREFIX} [generate-recurring-entries] No active tenants`,
      );
      return;
    }

    const useCase = makeGenerateRecurringBatchUseCase();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    let totalGenerated = 0;
    let totalConfigsProcessed = 0;
    let tenantsWithErrors = 0;

    for (const tenantId of activeTenantIds) {
      try {
        const result = await useCase.execute({ tenantId, endDate });
        totalGenerated += result.generatedCount;
        totalConfigsProcessed += result.configsProcessed;

        if (result.generatedCount > 0) {
          logger.info(
            {
              tenantId,
              generatedCount: result.generatedCount,
              configsProcessed: result.configsProcessed,
              pausedByExpiry: result.pausedByExpiry,
            },
            `${LOG_PREFIX} [generate-recurring-entries] Tenant processed`,
          );
        }
      } catch (tenantError) {
        tenantsWithErrors++;
        logger.error(
          { tenantId, error: tenantError },
          `${LOG_PREFIX} [generate-recurring-entries] Tenant failed`,
        );
      }
    }

    logger.info(
      {
        tenantsProcessed: activeTenantIds.length,
        totalGenerated,
        totalConfigsProcessed,
        tenantsWithErrors,
      },
      `${LOG_PREFIX} [generate-recurring-entries] Batch complete`,
    );
  }

  /**
   * Process overdue escalations for all active tenants.
   * Finds OVERDUE entries and triggers escalation steps.
   */
  private async processOverdueEscalations(): Promise<void> {
    const activeTenantIds = await this.getActiveTenantIds();

    if (activeTenantIds.length === 0) {
      logger.info(
        `${LOG_PREFIX} [process-overdue-escalations] No active tenants`,
      );
      return;
    }

    const useCase = makeProcessOverdueEscalationsUseCase();

    let totalProcessed = 0;
    let totalActionsCreated = 0;
    let tenantsWithErrors = 0;

    for (const tenantId of activeTenantIds) {
      try {
        const result = await useCase.execute({ tenantId });
        totalProcessed += result.processed;
        totalActionsCreated += result.actionsCreated;

        if (result.actionsCreated > 0 || result.errors.length > 0) {
          logger.info(
            {
              tenantId,
              processed: result.processed,
              actionsCreated: result.actionsCreated,
              messagesSent: result.messagesSent,
              messagesFailed: result.messagesFailed,
              errors: result.errors,
            },
            `${LOG_PREFIX} [process-overdue-escalations] Tenant processed`,
          );
        }
      } catch (tenantError) {
        tenantsWithErrors++;
        logger.error(
          { tenantId, error: tenantError },
          `${LOG_PREFIX} [process-overdue-escalations] Tenant failed`,
        );
      }
    }

    logger.info(
      {
        tenantsProcessed: activeTenantIds.length,
        totalProcessed,
        totalActionsCreated,
        tenantsWithErrors,
      },
      `${LOG_PREFIX} [process-overdue-escalations] Batch complete`,
    );
  }

  /**
   * Sync bank transactions for all active bank connections (Pluggy).
   * Iterates over all active tenants that have bank connections.
   */
  private async syncBankTransactions(): Promise<void> {
    const activeConnections = await prisma.bankConnection.findMany({
      where: {
        status: 'ACTIVE',
        tenant: {
          status: 'ACTIVE',
          deletedAt: null,
        },
      },
      select: {
        id: true,
        tenantId: true,
      },
    });

    if (activeConnections.length === 0) {
      logger.info(
        `${LOG_PREFIX} [sync-bank-transactions] No active bank connections`,
      );
      return;
    }

    logger.info(
      { connectionCount: activeConnections.length },
      `${LOG_PREFIX} [sync-bank-transactions] Syncing connections`,
    );

    const useCase = makeSyncBankTransactionsUseCase();
    let synced = 0;
    let failed = 0;

    for (const connection of activeConnections) {
      try {
        const result = await useCase.execute({
          tenantId: connection.tenantId,
          connectionId: connection.id,
        });

        synced++;

        if (result.transactionsImported > 0) {
          logger.info(
            {
              tenantId: connection.tenantId,
              connectionId: connection.id,
              transactionsImported: result.transactionsImported,
              matchedCount: result.matchedCount,
            },
            `${LOG_PREFIX} [sync-bank-transactions] Connection synced`,
          );
        }
      } catch (syncError) {
        failed++;
        logger.error(
          {
            tenantId: connection.tenantId,
            connectionId: connection.id,
            error: syncError,
          },
          `${LOG_PREFIX} [sync-bank-transactions] Connection sync failed`,
        );
      }
    }

    logger.info(
      { totalConnections: activeConnections.length, synced, failed },
      `${LOG_PREFIX} [sync-bank-transactions] Batch complete`,
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  /**
   * Returns all active tenant IDs (non-deleted, ACTIVE status).
   */
  private async getActiveTenantIds(): Promise<string[]> {
    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    return tenants.map((t) => t.id);
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────

let schedulerInstance: FinanceScheduler | null = null;

export function getFinanceScheduler(): FinanceScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new FinanceScheduler();
  }
  return schedulerInstance;
}
