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
  '@/use-cases/hr/notifications/factories/make-notify-doc-expiry-use-case',
  () => ({
    makeNotifyDocExpiryUseCase: () => ({ execute: useCaseExecuteSpy }),
  }),
);

import { runDocExpiryJob } from './doc-expiry.job';

describe('runDocExpiryJob (P3-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCaseExecuteSpy.mockReset();
  });

  it('aggregates notifications, medical exams and trainings across tenants', async () => {
    useCaseExecuteSpy
      .mockResolvedValueOnce({
        notificationsCreated: 4,
        scannedMedicalExams: 20,
        scannedTrainings: 8,
      })
      .mockResolvedValueOnce({
        notificationsCreated: 1,
        scannedMedicalExams: 5,
        scannedTrainings: 2,
      });

    const result = await runDocExpiryJob(
      {},
      { listTenants: async () => ['t1', 't2'] },
    );

    expect(result).toEqual({
      tenantsProcessed: 2,
      failedTenants: 0,
      totalNotifications: 5,
      totalMedicalExams: 25,
      totalTrainings: 10,
    });
  });

  it('isolates per-tenant failures so other tenants still run', async () => {
    useCaseExecuteSpy
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({
        notificationsCreated: 3,
        scannedMedicalExams: 12,
        scannedTrainings: 1,
      });

    const result = await runDocExpiryJob(
      { trigger: 'manual' },
      { listTenants: async () => ['a', 'b'] },
    );

    expect(result.failedTenants).toBe(1);
    expect(result.totalNotifications).toBe(3);
  });

  it('returns zero counts when no tenants need scanning', async () => {
    const result = await runDocExpiryJob({}, { listTenants: async () => [] });

    expect(useCaseExecuteSpy).not.toHaveBeenCalled();
    expect(result.tenantsProcessed).toBe(0);
  });

  it('accepts an injected use-case factory for DI', async () => {
    const execute = vi.fn().mockResolvedValue({
      notificationsCreated: 2,
      scannedMedicalExams: 3,
      scannedTrainings: 4,
    });

    const result = await runDocExpiryJob(
      {},
      {
        listTenants: async () => ['x'],
        factory: () => ({ execute }),
      },
    );

    expect(execute).toHaveBeenCalledWith({ tenantId: 'x' });
    expect(useCaseExecuteSpy).not.toHaveBeenCalled();
    expect(result.totalNotifications).toBe(2);
  });
});
