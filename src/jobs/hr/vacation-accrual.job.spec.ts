import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: { tenant: { findMany: vi.fn() } } }));

const useCaseExecuteSpy = vi.fn();
vi.mock(
  '@/use-cases/hr/vacations/factories/make-run-vacation-accrual-use-case',
  () => ({
    makeRunVacationAccrualUseCase: () => ({ execute: useCaseExecuteSpy }),
  }),
);

import { runVacationAccrualJob } from './vacation-accrual.job';

describe('runVacationAccrualJob (P3-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCaseExecuteSpy.mockReset();
  });

  it('fans out across every tenant returned by the lister and aggregates results', async () => {
    useCaseExecuteSpy
      .mockResolvedValueOnce({
        createdPeriods: 3,
        skippedPeriods: 1,
        evaluatedEmployees: 10,
      })
      .mockResolvedValueOnce({
        createdPeriods: 2,
        skippedPeriods: 0,
        evaluatedEmployees: 4,
      });

    const result = await runVacationAccrualJob(
      {},
      { listTenants: async () => ['tenant-a', 'tenant-b'] },
    );

    expect(useCaseExecuteSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      tenantsProcessed: 2,
      failedTenants: 0,
      totalCreated: 5,
      totalSkipped: 1,
      totalEvaluated: 14,
    });
  });

  it('continues processing remaining tenants when one fails and counts the failure', async () => {
    useCaseExecuteSpy
      .mockResolvedValueOnce({
        createdPeriods: 1,
        skippedPeriods: 0,
        evaluatedEmployees: 2,
      })
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce({
        createdPeriods: 4,
        skippedPeriods: 2,
        evaluatedEmployees: 5,
      });

    const result = await runVacationAccrualJob(
      { trigger: 'manual' },
      { listTenants: async () => ['a', 'b', 'c'] },
    );

    expect(useCaseExecuteSpy).toHaveBeenCalledTimes(3);
    expect(result.failedTenants).toBe(1);
    expect(result.totalCreated).toBe(5);
    expect(result.totalEvaluated).toBe(7);
  });

  it('returns an all-zero result when there are no active tenants', async () => {
    const result = await runVacationAccrualJob(
      {},
      { listTenants: async () => [] },
    );

    expect(useCaseExecuteSpy).not.toHaveBeenCalled();
    expect(result).toEqual({
      tenantsProcessed: 0,
      failedTenants: 0,
      totalCreated: 0,
      totalSkipped: 0,
      totalEvaluated: 0,
    });
  });

  it('accepts an injected factory so Prisma does not need to load in unit tests', async () => {
    const customExecute = vi.fn().mockResolvedValue({
      createdPeriods: 7,
      skippedPeriods: 0,
      evaluatedEmployees: 9,
    });

    const result = await runVacationAccrualJob(
      { trigger: 'cron' },
      {
        listTenants: async () => ['only-one'],
        factory: () => ({ execute: customExecute }),
      },
    );

    expect(customExecute).toHaveBeenCalledWith({ tenantId: 'only-one' });
    expect(useCaseExecuteSpy).not.toHaveBeenCalled();
    expect(result.totalCreated).toBe(7);
  });

  it('defaults the trigger to "cron" when no payload is supplied', async () => {
    const result = await runVacationAccrualJob(undefined, {
      listTenants: async () => [],
    });

    expect(result.tenantsProcessed).toBe(0);
  });
});
