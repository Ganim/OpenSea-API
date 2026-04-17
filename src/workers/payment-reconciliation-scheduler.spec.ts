import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the worker BEFORE importing the scheduler so the scheduler picks
// up the fake implementation. Each test asserts against this spy.
const executeSpy = vi.fn();

vi.mock('./payment-reconciliation.worker', () => ({
  PaymentReconciliationWorker: vi.fn().mockImplementation(() => ({
    execute: executeSpy,
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  startPaymentReconciliationScheduler,
  stopPaymentReconciliationScheduler,
} from './payment-reconciliation-scheduler';

describe('PaymentReconciliationScheduler (P3-23 smoke)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    executeSpy.mockReset();
    executeSpy.mockResolvedValue(undefined);
  });

  afterEach(() => {
    stopPaymentReconciliationScheduler();
    vi.useRealTimers();
  });

  // Each test uses a unique UTC date so the scheduler's module-level
  // `lastRunDateKey` (which intentionally persists across a process'
  // lifetime to deduplicate runs within a day) does not leak behavior
  // between tests.

  it('runs the worker immediately on start when the current UTC hour matches target', async () => {
    vi.setSystemTime(new Date('2026-01-01T02:15:00Z'));

    await startPaymentReconciliationScheduler();

    expect(executeSpy).toHaveBeenCalledTimes(1);
  });

  it('does not run the worker outside the target UTC hour window', async () => {
    vi.setSystemTime(new Date('2026-02-01T13:00:00Z'));

    await startPaymentReconciliationScheduler();

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('does not double-run on the same UTC date even if the tick fires twice', async () => {
    vi.setSystemTime(new Date('2026-03-01T02:00:00Z'));

    await startPaymentReconciliationScheduler();
    expect(executeSpy).toHaveBeenCalledTimes(1);

    // Advance 1 min to trigger the internal setInterval tick — still the
    // same target hour, same date key, so runIfDue() must bail.
    await vi.advanceTimersByTimeAsync(60_000);

    expect(executeSpy).toHaveBeenCalledTimes(1);
  });

  it('stop() clears the interval so no further ticks fire', async () => {
    vi.setSystemTime(new Date('2026-04-01T13:00:00Z'));

    await startPaymentReconciliationScheduler();
    stopPaymentReconciliationScheduler();

    // Time-travel to the target hour on a later day — without the
    // interval, the worker must not be invoked.
    vi.setSystemTime(new Date('2026-04-02T02:00:00Z'));
    await vi.advanceTimersByTimeAsync(120_000);

    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('swallows worker errors so a failure never crashes the interval', async () => {
    vi.setSystemTime(new Date('2026-05-01T02:00:00Z'));
    executeSpy.mockRejectedValueOnce(new Error('boom'));

    await expect(
      startPaymentReconciliationScheduler(),
    ).resolves.toBeUndefined();
  });
});
