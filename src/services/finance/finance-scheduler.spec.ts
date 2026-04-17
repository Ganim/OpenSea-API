import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock prisma + logger + every use-case factory ───────────────────
// The scheduler pulls a dozen factory-made use cases at runtime. For the
// tick-gate tests we don't care what the jobs do — we only care whether
// the scheduler decides to call them. Stubbing every upstream import
// keeps the test fully hermetic (no DB, no network) and fast.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: { findMany: vi.fn().mockResolvedValue([]) },
    bankConnection: { findMany: vi.fn().mockResolvedValue([]) },
    bankAccount: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/services/rbac/get-permission-service', () => ({
  getPermissionService: vi.fn().mockReturnValue({
    listUsersWithPermission: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock(
  '@/use-cases/finance/escalations/factories/make-process-overdue-escalations-use-case',
  () => ({
    makeProcessOverdueEscalationsUseCase: vi
      .fn()
      .mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
  }),
);

vi.mock(
  '@/use-cases/finance/recurring/factories/make-generate-recurring-batch',
  () => ({
    makeGenerateRecurringBatchUseCase: vi
      .fn()
      .mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
  }),
);

vi.mock(
  '@/use-cases/finance/bank-connections/factories/make-sync-bank-transactions-use-case',
  () => ({
    makeSyncBankTransactionsUseCase: vi
      .fn()
      .mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
  }),
);

vi.mock(
  '@/repositories/finance/prisma/prisma-cashflow-snapshots-repository',
  () => ({
    PrismaCashflowSnapshotsRepository: vi.fn(),
  }),
);

vi.mock(
  '@/use-cases/finance/dashboard/factories/make-get-predictive-cashflow-use-case',
  () => ({
    makeGetPredictiveCashflowUseCase: vi
      .fn()
      .mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
  }),
);

vi.mock(
  '@/use-cases/finance/reconciliation/factories/make-auto-reconcile-use-case',
  () => ({
    makeAutoReconcileUseCase: vi
      .fn()
      .mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
  }),
);

vi.mock('@/services/banking/get-banking-provider', () => ({
  getBankingProviderForAccount: vi.fn().mockResolvedValue(null),
}));

vi.mock(
  '@/use-cases/finance/entries/factories/make-check-overdue-entries-use-case',
  () => ({
    makeCheckOverdueEntriesUseCase: vi
      .fn()
      .mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
  }),
);

vi.mock(
  '@/use-cases/finance/contracts/factories/make-generate-contract-entries-use-case',
  () => ({
    makeGenerateContractEntriesUseCase: vi
      .fn()
      .mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
  }),
);

vi.mock(
  '@/use-cases/finance/compliance/factories/make-generate-tax-obligations-use-case',
  () => ({
    makeGenerateTaxObligationsUseCase: vi
      .fn()
      .mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
  }),
);

vi.mock(
  '@/use-cases/finance/recurring/factories/make-apply-indexation',
  () => ({
    makeApplyIndexationUseCase: vi
      .fn()
      .mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
  }),
);

vi.mock(
  '@/use-cases/finance/analytics/factories/make-detect-anomalies-use-case',
  () => ({
    makeDetectAnomaliesUseCase: vi
      .fn()
      .mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
  }),
);

vi.mock(
  '@/use-cases/finance/alerts/factories/make-check-cashflow-alerts-use-case',
  () => ({
    makeCheckCashFlowAlertsUseCase: vi
      .fn()
      .mockReturnValue({ execute: vi.fn().mockResolvedValue({}) }),
  }),
);

import { FinanceScheduler } from './finance-scheduler';

/**
 * Access the private `tick()` and `jobs` without widening the public API.
 * Vitest's fake timers pin `new Date()` and `Date.now()` so job gating
 * that reads `nowDate.getUTCHours()` resolves deterministically.
 */
type SchedulerInternals = {
  tick: () => Promise<void>;
  jobs: Array<{
    name: string;
    targetHour: number | null;
    targetDay?: number | null;
    targetMonth?: number | null;
    intervalMs: number;
    lastRunAt: number;
    execute: () => Promise<void>;
  }>;
};

function asInternals(scheduler: FinanceScheduler): SchedulerInternals {
  return scheduler as unknown as SchedulerInternals;
}

describe('FinanceScheduler.tick() — UTC hour gating (P2-61)', () => {
  let scheduler: FinanceScheduler;

  beforeEach(() => {
    scheduler = new FinanceScheduler();

    // Replace each job's `execute` with a vi.fn() so we can assert calls
    // without running the real use-case logic.
    for (const job of asInternals(scheduler).jobs) {
      job.execute = vi.fn().mockResolvedValue(undefined);
    }

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  function findJob(name: string) {
    const job = asInternals(scheduler).jobs.find((j) => j.name === name);
    if (!job) throw new Error(`Job not found: ${name}`);
    return job;
  }

  it('should fire process-overdue-escalations at 11 UTC (target hour)', async () => {
    // 2026-01-01T11:00:00Z — matches targetHour=11 for the job
    vi.setSystemTime(new Date('2026-01-01T11:00:00Z'));

    await asInternals(scheduler).tick();

    const job = findJob('process-overdue-escalations');
    expect(job.execute).toHaveBeenCalledTimes(1);
  });

  it('should NOT fire process-overdue-escalations at 12 UTC (outside target hour)', async () => {
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

    await asInternals(scheduler).tick();

    const job = findJob('process-overdue-escalations');
    expect(job.execute).not.toHaveBeenCalled();
  });

  it('should NOT fire process-overdue-escalations at 10 UTC (hour before target)', async () => {
    vi.setSystemTime(new Date('2026-01-01T10:59:59Z'));

    await asInternals(scheduler).tick();

    const job = findJob('process-overdue-escalations');
    expect(job.execute).not.toHaveBeenCalled();
  });

  it('should use UTC hours, not local hours (regression against local-time bug P1-06)', async () => {
    // If the scheduler had mistakenly used getHours() (local) instead of
    // getUTCHours(), a host in GMT-3 (BRT) would see 08:00 local when
    // system time is 11:00 UTC, and process-overdue-escalations would
    // NOT fire (targetHour=11). We assert UTC reading is in force.
    vi.setSystemTime(new Date('2026-06-15T11:00:00Z'));

    await asInternals(scheduler).tick();

    const job = findJob('process-overdue-escalations');
    expect(job.execute).toHaveBeenCalledTimes(1);
  });

  it('should respect the 24h interval gate — a second tick within an hour must not re-run a daily job', async () => {
    vi.setSystemTime(new Date('2026-01-01T11:00:00Z'));
    await asInternals(scheduler).tick();

    const job = findJob('process-overdue-escalations');
    expect(job.execute).toHaveBeenCalledTimes(1);

    // 5 minutes later — still in the target hour window, but interval
    // gate (24h) prevents re-execution.
    vi.setSystemTime(new Date('2026-01-01T11:05:00Z'));
    await asInternals(scheduler).tick();

    expect(job.execute).toHaveBeenCalledTimes(1);
  });

  it('should honour the interval AFTER the hour passes — next fire is 24h later, not the next tick', async () => {
    vi.setSystemTime(new Date('2026-01-01T11:00:00Z'));
    await asInternals(scheduler).tick();

    const job = findJob('process-overdue-escalations');
    expect(job.execute).toHaveBeenCalledTimes(1);

    // Next day at 10:00 UTC — wrong hour, no run.
    vi.setSystemTime(new Date('2026-01-02T10:00:00Z'));
    await asInternals(scheduler).tick();
    expect(job.execute).toHaveBeenCalledTimes(1);

    // Next day at 11:00 UTC — both gates (hour + interval) satisfied.
    vi.setSystemTime(new Date('2026-01-02T11:00:00Z'));
    await asInternals(scheduler).tick();
    expect(job.execute).toHaveBeenCalledTimes(2);
  });

  it('should fire interval-only jobs (sync-bank-transactions) independent of the hour', async () => {
    // sync-bank-transactions has targetHour=null and intervalMs=4h.
    // After 4h from lastRunAt=0, any hour should trigger it.
    vi.setSystemTime(new Date('2026-03-10T03:17:00Z'));

    await asInternals(scheduler).tick();

    const job = findJob('sync-bank-transactions');
    expect(job.execute).toHaveBeenCalledTimes(1);
  });

  it('should only fire apply-indexation on January 1st (annual job)', async () => {
    // apply-indexation has targetHour=6, targetDay=1, targetMonth=1.
    // Correct day/month/hour:
    vi.setSystemTime(new Date('2026-01-01T06:00:00Z'));

    await asInternals(scheduler).tick();

    const job = findJob('apply-indexation');
    expect(job.execute).toHaveBeenCalledTimes(1);
  });

  it('should NOT fire apply-indexation in February (wrong month)', async () => {
    vi.setSystemTime(new Date('2026-02-01T06:00:00Z'));

    await asInternals(scheduler).tick();

    const job = findJob('apply-indexation');
    expect(job.execute).not.toHaveBeenCalled();
  });

  it('should NOT fire apply-indexation on January 2nd (wrong day)', async () => {
    vi.setSystemTime(new Date('2026-01-02T06:00:00Z'));

    await asInternals(scheduler).tick();

    const job = findJob('apply-indexation');
    expect(job.execute).not.toHaveBeenCalled();
  });

  it('should only fire generate-contract-entries on day 1 of any month', async () => {
    vi.setSystemTime(new Date('2026-05-01T08:00:00Z'));

    await asInternals(scheduler).tick();

    const job = findJob('generate-contract-entries');
    expect(job.execute).toHaveBeenCalledTimes(1);
  });

  it('should NOT fire generate-contract-entries on day 15', async () => {
    vi.setSystemTime(new Date('2026-05-15T08:00:00Z'));

    await asInternals(scheduler).tick();

    const job = findJob('generate-contract-entries');
    expect(job.execute).not.toHaveBeenCalled();
  });
});
