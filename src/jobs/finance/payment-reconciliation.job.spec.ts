import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must be registered before importing the job wrapper.
// ---------------------------------------------------------------------------

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const recordTelemetrySpy = vi.fn();
vi.mock('@/lib/telemetry/payment-reconciliation-telemetry', () => ({
  recordPaymentReconciliation: (...args: unknown[]) =>
    recordTelemetrySpy(...args),
}));

// The default-factory path imports the in-process worker. Stub its constructor
// so the spec doesn't pull Prisma + the entire repository graph just to assert
// `execute()` was invoked.
const defaultExecuteSpy = vi.fn();
vi.mock('@/workers/payment-reconciliation.worker', () => ({
  PaymentReconciliationWorker: vi.fn().mockImplementation(() => ({
    execute: defaultExecuteSpy,
  })),
}));

import { runPaymentReconciliationJob } from './payment-reconciliation.job';

describe('runPaymentReconciliationJob (P3-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultExecuteSpy.mockReset();
    defaultExecuteSpy.mockResolvedValue(undefined);
    recordTelemetrySpy.mockReset();
  });

  it('invokes the underlying worker exactly once per call (default factory)', async () => {
    await runPaymentReconciliationJob();

    expect(defaultExecuteSpy).toHaveBeenCalledTimes(1);
  });

  it('uses the injected factory when provided so business logic is not duplicated', async () => {
    const customExecute = vi.fn().mockResolvedValue(undefined);
    const factory = vi.fn(() => ({ execute: customExecute }));

    await runPaymentReconciliationJob({ trigger: 'manual' }, factory);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(customExecute).toHaveBeenCalledTimes(1);
    // Default worker must NOT be touched when a factory is supplied — that is
    // the whole point of dependency injection here.
    expect(defaultExecuteSpy).not.toHaveBeenCalled();
  });

  it('rethrows worker errors so BullMQ retry / DLQ can react', async () => {
    const factory = () => ({
      execute: vi.fn().mockRejectedValue(new Error('provider down')),
    });

    await expect(
      runPaymentReconciliationJob({ trigger: 'cron' }, factory),
    ).rejects.toThrow('provider down');
  });

  it('records aggregate failure telemetry when the run blows up', async () => {
    const factory = () => ({
      execute: vi.fn().mockRejectedValue(new Error('boom')),
    });

    await expect(runPaymentReconciliationJob({}, factory)).rejects.toThrow(
      'boom',
    );

    expect(recordTelemetrySpy).toHaveBeenCalledTimes(1);
    expect(recordTelemetrySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'aggregate',
        success: false,
        processed: 0,
      }),
    );
  });

  it('does NOT emit aggregate telemetry on success — per-tenant entries already cover it', async () => {
    const factory = () => ({ execute: vi.fn().mockResolvedValue(undefined) });

    await runPaymentReconciliationJob({ trigger: 'cron' }, factory);

    expect(recordTelemetrySpy).not.toHaveBeenCalled();
  });

  it('defaults the trigger to "cron" when no payload is supplied', async () => {
    // Smoke test that an empty payload is accepted (BullMQ may pass `{}` for
    // a repeatable job that has no explicit data).
    await expect(runPaymentReconciliationJob()).resolves.toBeUndefined();
    expect(defaultExecuteSpy).toHaveBeenCalledTimes(1);
  });
});
