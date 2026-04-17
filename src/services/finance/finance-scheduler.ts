import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import type { PermissionService } from '@/services/rbac/permission-service';
import { makeProcessOverdueEscalationsUseCase } from '@/use-cases/finance/escalations/factories/make-process-overdue-escalations-use-case';
import { makeGenerateRecurringBatchUseCase } from '@/use-cases/finance/recurring/factories/make-generate-recurring-batch';
import { makeSyncBankTransactionsUseCase } from '@/use-cases/finance/bank-connections/factories/make-sync-bank-transactions-use-case';
import { PrismaCashflowSnapshotsRepository } from '@/repositories/finance/prisma/prisma-cashflow-snapshots-repository';
import { makeGetPredictiveCashflowUseCase } from '@/use-cases/finance/dashboard/factories/make-get-predictive-cashflow-use-case';
import { makeAutoReconcileUseCase } from '@/use-cases/finance/reconciliation/factories/make-auto-reconcile-use-case';
import { getBankingProviderForAccount } from '@/services/banking/get-banking-provider';
import { makeCheckOverdueEntriesUseCase } from '@/use-cases/finance/entries/factories/make-check-overdue-entries-use-case';
import { makeGenerateContractEntriesUseCase } from '@/use-cases/finance/contracts/factories/make-generate-contract-entries-use-case';
import { makeGenerateTaxObligationsUseCase } from '@/use-cases/finance/compliance/factories/make-generate-tax-obligations-use-case';
import { makeApplyIndexationUseCase } from '@/use-cases/finance/recurring/factories/make-apply-indexation';
import { makeDetectAnomaliesUseCase } from '@/use-cases/finance/analytics/factories/make-detect-anomalies-use-case';
import { makeCheckCashFlowAlertsUseCase } from '@/use-cases/finance/alerts/factories/make-check-cashflow-alerts-use-case';

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
  /**
   * Target hour (0-23) in **UTC**. Null = interval-based only.
   * We use UTC because production runs on UTC servers (Fly.io / Neon); using
   * local time would shift each job by the host's offset and skip targets
   * entirely on UTC-only hosts.
   */
  targetHour: number | null;
  /**
   * Optional target day of month (1-28) for monthly jobs. When set together
   * with targetHour, the job only fires when both match. Use 1-28 to keep
   * monthly jobs valid for every month (avoids 29/30/31 edge cases).
   */
  targetDay?: number | null;
  /**
   * Optional target month (1-12) for annual jobs.
   */
  targetMonth?: number | null;
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
 * 4. Save Cashflow Snapshots      — daily at ~23:00
 */
export class FinanceScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private jobs: ScheduledJob[] = [];

  constructor() {
    // Hours below are UTC (production = UTC server). To run "at 8 AM Brasília"
    // pick UTC = 11 (BRT is UTC-3). All targetHour values were chosen to
    // spread load across early-morning hours when ERP traffic is lowest.
    this.jobs = [
      {
        name: 'generate-recurring-entries',
        targetHour: 9, // ~06:00 BRT
        intervalMs: TWENTY_FOUR_HOURS_MS,
        lastRunAt: 0,
        execute: this.generateRecurringEntries.bind(this),
      },
      {
        name: 'process-overdue-escalations',
        targetHour: 11, // ~08:00 BRT
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
      {
        name: 'save-cashflow-snapshots',
        targetHour: 2, // ~23:00 BRT (previous day) — end-of-day snapshot
        intervalMs: TWENTY_FOUR_HOURS_MS,
        lastRunAt: 0,
        execute: this.saveCashflowSnapshots.bind(this),
      },
      // ─── Newly registered jobs (closing audit P1-44 to P1-52) ─────────
      {
        // P1-46: status OVERDUE was never auto-applied without this cron.
        name: 'check-overdue-entries',
        targetHour: 10, // ~07:00 BRT, runs after recurring batch
        intervalMs: TWENTY_FOUR_HOURS_MS,
        lastRunAt: 0,
        execute: this.checkOverdueEntries.bind(this),
      },
      {
        // P1-52: contracts (rent, insurance, subscriptions) were not
        // auto-generating their monthly entries.
        name: 'generate-contract-entries',
        targetHour: 8, // ~05:00 BRT
        targetDay: 1, // first day of every month
        intervalMs: TWENTY_FOUR_HOURS_MS,
        lastRunAt: 0,
        execute: this.generateContractEntries.bind(this),
      },
      {
        // P1-45: tax calendar (DAS, DARF) was never populated automatically.
        name: 'generate-tax-obligations',
        targetHour: 7, // ~04:00 BRT
        targetDay: 1, // first day of every month
        intervalMs: TWENTY_FOUR_HOURS_MS,
        lastRunAt: 0,
        execute: this.generateTaxObligations.bind(this),
      },
      {
        // P1-44: indexation (IPCA / IGP-M) was never applied annually.
        name: 'apply-indexation',
        targetHour: 6, // ~03:00 BRT
        targetDay: 1,
        targetMonth: 1, // January 1st each year
        intervalMs: TWENTY_FOUR_HOURS_MS,
        lastRunAt: 0,
        execute: this.applyIndexation.bind(this),
      },
      {
        // P1-50: anomaly detection (suspicious payments, duplicates) was idle.
        name: 'detect-anomalies',
        targetHour: 12, // ~09:00 BRT, after most jobs settled
        // Weekly: every 7 days. The interval guard handles cadence; we don't
        // need a target day-of-week because targetHour + 7d interval is enough.
        intervalMs: 7 * TWENTY_FOUR_HOURS_MS,
        lastRunAt: 0,
        execute: this.detectAnomalies.bind(this),
      },
      {
        // P1-51: cashflow alerts (low balance, overdue surge) never fired.
        name: 'check-cashflow-alerts',
        targetHour: 13, // ~10:00 BRT
        intervalMs: TWENTY_FOUR_HOURS_MS,
        lastRunAt: 0,
        execute: this.checkCashflowAlerts.bind(this),
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
      const nowDate = new Date();
      // Use UTC across the board (P1-06): production servers run in UTC, so
      // local time would skew every targetHour/targetDay/targetMonth check.
      const currentHour = nowDate.getUTCHours();
      const currentDay = nowDate.getUTCDate();
      const currentMonth = nowDate.getUTCMonth() + 1; // 1-12

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

        // Optional day-of-month gate (monthly jobs)
        if (
          job.targetDay !== undefined &&
          job.targetDay !== null &&
          currentDay !== job.targetDay
        ) {
          continue;
        }

        // Optional month gate (annual jobs)
        if (
          job.targetMonth !== undefined &&
          job.targetMonth !== null &&
          currentMonth !== job.targetMonth
        ) {
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
    const permissionService = getPermissionService();

    let totalProcessed = 0;
    let totalActionsCreated = 0;
    let tenantsWithErrors = 0;

    for (const tenantId of activeTenantIds) {
      try {
        // Resolve finance admin users for SYSTEM_ALERT notifications
        const notifyUserIds = await this.resolveFinanceAdminUsers(
          tenantId,
          permissionService,
        );

        const result = await useCase.execute({ tenantId, notifyUserIds });
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

    let synced = 0;
    let failed = 0;

    if (activeConnections.length === 0) {
      logger.info(
        `${LOG_PREFIX} [sync-bank-transactions] No active Pluggy bank connections`,
      );
    } else {
      logger.info(
        { connectionCount: activeConnections.length },
        `${LOG_PREFIX} [sync-bank-transactions] Syncing Pluggy connections`,
      );

      const useCase = makeSyncBankTransactionsUseCase();

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
        `${LOG_PREFIX} [sync-bank-transactions] Pluggy batch complete`,
      );
    }

    // --- Sicoob / Direct API sync ---
    const apiAccounts = await prisma.bankAccount.findMany({
      where: {
        apiEnabled: true,
        apiProvider: { not: null },
        deletedAt: null,
        tenant: { status: 'ACTIVE', deletedAt: null },
      },
      select: {
        id: true,
        tenantId: true,
        accountNumber: true,
        apiProvider: true,
      },
    });

    if (apiAccounts.length > 0) {
      logger.info(
        { count: apiAccounts.length },
        `${LOG_PREFIX} [sync-bank-transactions] Syncing direct API accounts`,
      );

      for (const account of apiAccounts) {
        try {
          const provider = await getBankingProviderForAccount(account.id);
          await provider.authenticate();

          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const today = new Date();

          // getTransactions expects ISO date strings (YYYY-MM-DD)
          const fromStr = thirtyDaysAgo.toISOString().split('T')[0];
          const toStr = today.toISOString().split('T')[0];

          const transactions = await provider.getTransactions(
            account.accountNumber,
            fromStr,
            toStr,
          );

          if (transactions.length > 0) {
            // TODO: Create BankReconciliationItem records for auto-matching
            logger.info(
              {
                tenantId: account.tenantId,
                bankAccountId: account.id,
                provider: account.apiProvider,
                transactionCount: transactions.length,
              },
              `${LOG_PREFIX} [sync-bank-transactions] API account synced`,
            );
          }

          // Update current balance from provider.
          // P2-10: scope by tenantId via updateMany so a compromised
          // apiAccounts list (or a driver id collision) can't write a
          // balance to another tenant's BankAccount with the same id.
          const balance = await provider.getBalance(account.accountNumber);
          await prisma.bankAccount.updateMany({
            where: { id: account.id, tenantId: account.tenantId },
            data: {
              currentBalance: balance.available,
              balanceUpdatedAt: new Date(),
            },
          });

          synced++;
        } catch (apiSyncError) {
          failed++;
          logger.error(
            {
              bankAccountId: account.id,
              tenantId: account.tenantId,
              error: apiSyncError,
            },
            `${LOG_PREFIX} [sync-bank-transactions] API account sync failed`,
          );
        }
      }
    }

    // After syncing, run auto-reconcile on active (non-completed) reconciliations
    await this.runAutoReconcile();
  }

  /**
   * Run auto-reconcile on all active reconciliations.
   * Triggered after bank transaction sync to match new transactions.
   */
  private async runAutoReconcile(): Promise<void> {
    const activeReconciliations = await prisma.bankReconciliation.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
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

    if (activeReconciliations.length === 0) {
      return;
    }

    const autoReconcileUseCase = makeAutoReconcileUseCase();
    let totalAutoReconciled = 0;
    let totalSuggestionsCreated = 0;

    for (const reconciliation of activeReconciliations) {
      try {
        const result = await autoReconcileUseCase.execute({
          tenantId: reconciliation.tenantId,
          reconciliationId: reconciliation.id,
        });

        totalAutoReconciled += result.autoReconciled;
        totalSuggestionsCreated += result.suggestionsCreated;

        if (result.autoReconciled > 0 || result.suggestionsCreated > 0) {
          logger.info(
            {
              reconciliationId: reconciliation.id,
              tenantId: reconciliation.tenantId,
              autoReconciled: result.autoReconciled,
              suggestionsCreated: result.suggestionsCreated,
            },
            `${LOG_PREFIX} [auto-reconcile] Reconciliation processed`,
          );
        }
      } catch (autoReconcileError) {
        logger.error(
          {
            reconciliationId: reconciliation.id,
            tenantId: reconciliation.tenantId,
            error: autoReconcileError,
          },
          `${LOG_PREFIX} [auto-reconcile] Failed`,
        );
      }
    }

    if (totalAutoReconciled > 0 || totalSuggestionsCreated > 0) {
      logger.info(
        {
          reconciliationsProcessed: activeReconciliations.length,
          totalAutoReconciled,
          totalSuggestionsCreated,
        },
        `${LOG_PREFIX} [auto-reconcile] Batch complete`,
      );
    }
  }

  /**
   * Save cashflow snapshots for all active tenants.
   * For each tenant:
   * 1. Get today's predictive cashflow forecast → save as predicted values
   * 2. Calculate today's actual inflow/outflow from realized entries → update snapshot
   */
  private async saveCashflowSnapshots(): Promise<void> {
    const activeTenantIds = await this.getActiveTenantIds();

    if (activeTenantIds.length === 0) {
      logger.info(`${LOG_PREFIX} [save-cashflow-snapshots] No active tenants`);
      return;
    }

    const snapshotsRepository = new PrismaCashflowSnapshotsRepository();
    const predictiveUseCase = makeGetPredictiveCashflowUseCase();

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const todayStr = today.toISOString().split('T')[0];

    let savedCount = 0;
    let tenantsWithErrors = 0;

    for (const tenantId of activeTenantIds) {
      try {
        // 1. Get predicted values from the predictive cashflow engine
        const predictiveReport = await predictiveUseCase.execute({
          tenantId,
          months: 1,
        });

        const todayProjection = predictiveReport.dailyProjection.find(
          (dp) => dp.date === todayStr,
        );

        // Use daily averages from first projected month as fallback
        const firstMonth = predictiveReport.projectedMonths[0];
        const daysInMonth = 30;
        const predictedDailyInflow = firstMonth
          ? firstMonth.projectedRevenue / daysInMonth
          : 0;
        const predictedDailyOutflow = firstMonth
          ? firstMonth.projectedExpenses / daysInMonth
          : 0;

        // P1-07: the previous code had a no-op ternary that returned the same
        // value in both branches. DailyProjection only carries a cumulative
        // balance (not a per-day inflow/outflow), so the day-specific lookup
        // never had a meaningful value to read. We use the monthly daily
        // average straight; the lookup is kept (`todayProjection`) only to
        // emit a debug log when missing so we can spot empty projections.
        if (!todayProjection) {
          logger.debug(
            { tenantId, todayStr },
            `${LOG_PREFIX} [save-cashflow-snapshots] No projection point for today`,
          );
        }
        const predictedInflow = predictedDailyInflow;
        const predictedOutflow = predictedDailyOutflow;

        // 2. Calculate actual inflow/outflow from realized entries today
        const todayStart = new Date(today);
        const todayEnd = new Date(today);
        todayEnd.setUTCHours(23, 59, 59, 999);

        const [actualInflowData, actualOutflowData] = await Promise.all([
          prisma.financeEntry.aggregate({
            where: {
              tenantId,
              type: 'RECEIVABLE',
              status: { in: ['PAID', 'RECEIVED'] },
              paymentDate: { gte: todayStart, lte: todayEnd },
            },
            _sum: { actualAmount: true },
          }),
          prisma.financeEntry.aggregate({
            where: {
              tenantId,
              type: 'PAYABLE',
              status: { in: ['PAID', 'RECEIVED'] },
              paymentDate: { gte: todayStart, lte: todayEnd },
            },
            _sum: { actualAmount: true },
          }),
        ]);

        const actualInflow = Number(actualInflowData._sum.actualAmount ?? 0);
        const actualOutflow = Number(actualOutflowData._sum.actualAmount ?? 0);

        await snapshotsRepository.upsert({
          tenantId,
          date: today,
          predictedInflow: Math.round(predictedInflow * 100) / 100,
          predictedOutflow: Math.round(predictedOutflow * 100) / 100,
          actualInflow,
          actualOutflow,
        });

        savedCount++;
      } catch (tenantError) {
        tenantsWithErrors++;
        logger.error(
          { tenantId, error: tenantError },
          `${LOG_PREFIX} [save-cashflow-snapshots] Tenant failed`,
        );
      }
    }

    logger.info(
      {
        tenantsProcessed: activeTenantIds.length,
        savedCount,
        tenantsWithErrors,
      },
      `${LOG_PREFIX} [save-cashflow-snapshots] Batch complete`,
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  /**
   * Find users in a tenant that have finance.entries.access permission.
   * These users will receive SYSTEM_ALERT notifications from escalations.
   */
  private async resolveFinanceAdminUsers(
    tenantId: string,
    permissionSvc: PermissionService,
  ): Promise<string[]> {
    try {
      const tenantUsers = await prisma.tenantUser.findMany({
        where: { tenantId, deletedAt: null },
        select: { userId: true },
      });

      const authorizedIds: string[] = [];

      for (const tu of tenantUsers) {
        const allowed = await permissionSvc.hasPermission(
          new UniqueEntityID(tu.userId),
          PermissionCodes.FINANCE.ENTRIES.ACCESS,
        );

        if (allowed) {
          authorizedIds.push(tu.userId);
        }
      }

      return authorizedIds;
    } catch (err) {
      logger.warn(
        { tenantId, error: err },
        `${LOG_PREFIX} [resolve-finance-admins] Failed, skipping SYSTEM_ALERT`,
      );
      return [];
    }
  }

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

  // ─── Newly registered job implementations ───────────────────────────

  /**
   * Mark PENDING entries with dueDate < today as OVERDUE.
   * Without this cron, status transitions only happen on user-triggered reads.
   */
  private async checkOverdueEntries(): Promise<void> {
    const tenantIds = await this.getActiveTenantIds();
    if (tenantIds.length === 0) return;

    const useCase = makeCheckOverdueEntriesUseCase();
    let totalProcessed = 0;
    let tenantsWithErrors = 0;

    for (const tenantId of tenantIds) {
      try {
        const result = await useCase.execute({ tenantId });
        totalProcessed += result.markedOverdue;
      } catch (err) {
        tenantsWithErrors++;
        logger.error(
          { tenantId, error: err },
          `${LOG_PREFIX} [check-overdue-entries] Tenant failed`,
        );
      }
    }

    logger.info(
      { tenantsProcessed: tenantIds.length, totalProcessed, tenantsWithErrors },
      `${LOG_PREFIX} [check-overdue-entries] Batch complete`,
    );
  }

  /**
   * Generate the current month's entries for every active contract per tenant.
   * Without this cron, recurring contracts (rent, insurance, subscriptions)
   * never auto-create their monthly finance entries.
   */
  private async generateContractEntries(): Promise<void> {
    const tenantIds = await this.getActiveTenantIds();
    if (tenantIds.length === 0) return;

    const useCase = makeGenerateContractEntriesUseCase();
    let totalGenerated = 0;
    let tenantsWithErrors = 0;
    let contractsProcessed = 0;

    for (const tenantId of tenantIds) {
      try {
        // The use case takes one contractId at a time, so we resolve all
        // ACTIVE non-deleted contracts for the tenant and loop. Limited to
        // contracts with a startDate in the past and endDate in the future
        // (or null) to skip clearly-inactive ones at SQL level.
        const today = new Date();
        const activeContracts = await prisma.contract.findMany({
          where: {
            tenantId,
            deletedAt: null,
            status: 'ACTIVE',
            startDate: { lte: today },
            endDate: { gte: today },
          },
          select: { id: true },
        });

        for (const { id } of activeContracts) {
          try {
            const result = await useCase.execute({
              tenantId,
              contractId: id,
            });
            totalGenerated += result.entriesCreated;
            contractsProcessed++;
          } catch (innerErr) {
            logger.error(
              { tenantId, contractId: id, error: innerErr },
              `${LOG_PREFIX} [generate-contract-entries] Contract failed`,
            );
          }
        }
      } catch (err) {
        tenantsWithErrors++;
        logger.error(
          { tenantId, error: err },
          `${LOG_PREFIX} [generate-contract-entries] Tenant failed`,
        );
      }
    }

    logger.info(
      {
        tenantsProcessed: tenantIds.length,
        contractsProcessed,
        totalGenerated,
        tenantsWithErrors,
      },
      `${LOG_PREFIX} [generate-contract-entries] Batch complete`,
    );
  }

  /**
   * Populate the Brazilian fiscal calendar (DAS, DARF, GPS) for the next month.
   */
  private async generateTaxObligations(): Promise<void> {
    const tenantIds = await this.getActiveTenantIds();
    if (tenantIds.length === 0) return;

    const useCase = makeGenerateTaxObligationsUseCase();
    const next = new Date();
    next.setUTCMonth(next.getUTCMonth() + 1);
    const year = next.getUTCFullYear();
    const month = next.getUTCMonth() + 1;

    let totalCreated = 0;
    let tenantsWithErrors = 0;

    for (const tenantId of tenantIds) {
      try {
        const result = await useCase.execute({ tenantId, year, month });
        totalCreated += result.created.length;
      } catch (err) {
        tenantsWithErrors++;
        logger.error(
          { tenantId, error: err },
          `${LOG_PREFIX} [generate-tax-obligations] Tenant failed`,
        );
      }
    }

    logger.info(
      {
        tenantsProcessed: tenantIds.length,
        totalCreated,
        tenantsWithErrors,
        targetYear: year,
        targetMonth: month,
      },
      `${LOG_PREFIX} [generate-tax-obligations] Batch complete`,
    );
  }

  /**
   * Annual indexation pass — re-applies IPCA / IGP-M to ACTIVE recurring
   * configs whose adjustment cycle is due.
   */
  private async applyIndexation(): Promise<void> {
    const tenantIds = await this.getActiveTenantIds();
    if (tenantIds.length === 0) return;

    const useCase = makeApplyIndexationUseCase();
    const referenceDate = new Date();
    let totalAdjusted = 0;
    let tenantsWithErrors = 0;

    for (const tenantId of tenantIds) {
      try {
        const result = await useCase.execute({ tenantId, referenceDate });
        totalAdjusted += result.adjustedCount;
      } catch (err) {
        tenantsWithErrors++;
        logger.error(
          { tenantId, error: err },
          `${LOG_PREFIX} [apply-indexation] Tenant failed`,
        );
      }
    }

    logger.info(
      { tenantsProcessed: tenantIds.length, totalAdjusted, tenantsWithErrors },
      `${LOG_PREFIX} [apply-indexation] Batch complete`,
    );
  }

  /**
   * Weekly anomaly detection across the last 6 months of finance entries.
   */
  private async detectAnomalies(): Promise<void> {
    const tenantIds = await this.getActiveTenantIds();
    if (tenantIds.length === 0) return;

    const useCase = makeDetectAnomaliesUseCase();
    let totalAnomalies = 0;
    let tenantsWithErrors = 0;

    for (const tenantId of tenantIds) {
      try {
        const report = await useCase.execute({ tenantId });
        totalAnomalies += report.anomalies.length;
      } catch (err) {
        tenantsWithErrors++;
        logger.error(
          { tenantId, error: err },
          `${LOG_PREFIX} [detect-anomalies] Tenant failed`,
        );
      }
    }

    logger.info(
      { tenantsProcessed: tenantIds.length, totalAnomalies, tenantsWithErrors },
      `${LOG_PREFIX} [detect-anomalies] Batch complete`,
    );
  }

  /**
   * Daily cashflow alert sweep — surfaces low balance, overdue surge, etc.
   */
  private async checkCashflowAlerts(): Promise<void> {
    const tenantIds = await this.getActiveTenantIds();
    if (tenantIds.length === 0) return;

    const useCase = makeCheckCashFlowAlertsUseCase();
    let totalAlerts = 0;
    let tenantsWithErrors = 0;

    for (const tenantId of tenantIds) {
      try {
        const result = await useCase.execute({ tenantId });
        totalAlerts += result.alerts.length;
      } catch (err) {
        tenantsWithErrors++;
        logger.error(
          { tenantId, error: err },
          `${LOG_PREFIX} [check-cashflow-alerts] Tenant failed`,
        );
      }
    }

    logger.info(
      { tenantsProcessed: tenantIds.length, totalAlerts, tenantsWithErrors },
      `${LOG_PREFIX} [check-cashflow-alerts] Batch complete`,
    );
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
