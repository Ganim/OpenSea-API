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
  '@/use-cases/hr/payrolls/factories/make-generate-monthly-payroll-draft-use-case',
  () => ({
    makeGenerateMonthlyPayrollDraftUseCase: () => ({
      execute: useCaseExecuteSpy,
    }),
  }),
);

import { runPayrollGenerationJob } from './payroll-generation.job';

describe('runPayrollGenerationJob (P3-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCaseExecuteSpy.mockReset();
  });

  it('counts created, already-existed and empty tenants separately', async () => {
    useCaseExecuteSpy
      .mockResolvedValueOnce({
        payroll: { id: { toString: () => 'p1' } },
        alreadyExisted: false,
        evaluatedEmployees: 10,
      })
      .mockResolvedValueOnce({
        payroll: { id: { toString: () => 'p2' } },
        alreadyExisted: true,
      })
      .mockResolvedValueOnce({ payroll: null });

    const result = await runPayrollGenerationJob(
      {},
      { listTenants: async () => ['a', 'b', 'c'] },
    );

    expect(result).toEqual({
      tenantsProcessed: 3,
      failedTenants: 0,
      totalCreated: 1,
      totalAlreadyExisted: 1,
      totalEmptyTenants: 1,
    });
  });

  it('skips to next tenant on error and increments failedTenants', async () => {
    useCaseExecuteSpy
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        payroll: { id: { toString: () => 'ok' } },
        alreadyExisted: false,
      });

    const result = await runPayrollGenerationJob(
      { trigger: 'manual' },
      { listTenants: async () => ['bad', 'good'] },
    );

    expect(result.failedTenants).toBe(1);
    expect(result.totalCreated).toBe(1);
  });

  it('returns zeros when no tenants are active', async () => {
    const result = await runPayrollGenerationJob(
      {},
      { listTenants: async () => [] },
    );

    expect(useCaseExecuteSpy).not.toHaveBeenCalled();
    expect(result.tenantsProcessed).toBe(0);
  });

  it('honors injected factory for DI', async () => {
    const execute = vi
      .fn()
      .mockResolvedValue({ payroll: { id: { toString: () => 'x' } } });

    const result = await runPayrollGenerationJob(
      {},
      {
        listTenants: async () => ['x'],
        factory: () => ({ execute }),
      },
    );

    expect(execute).toHaveBeenCalledTimes(1);
    expect(useCaseExecuteSpy).not.toHaveBeenCalled();
    expect(result.totalCreated).toBe(1);
  });
});
