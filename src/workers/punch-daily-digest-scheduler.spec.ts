import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tenantFindMany: vi.fn(),
  redisSet: vi.fn(),
  useCaseExecute: vi.fn(),
  busPublish: vi.fn(),
}));

vi.mock('@/@env', () => ({
  env: { NODE_ENV: 'test', BULLMQ_ENABLED: false },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { tenant: { findMany: mocks.tenantFindMany } },
}));

vi.mock('@/lib/redis', () => ({
  getRedisClient: () => ({ set: mocks.redisSet }),
}));

vi.mock('@/lib/events', () => ({
  getTypedEventBus: () => ({ publish: mocks.busPublish }),
}));

vi.mock(
  '@/use-cases/hr/punch-dashboard/factories/make-compute-daily-digest',
  () => ({
    makeComputeDailyDigestUseCase: () => ({ execute: mocks.useCaseExecute }),
  }),
);

import { runPunchDailyDigestIfDue } from './punch-daily-digest-scheduler';

describe('runPunchDailyDigestIfDue', () => {
  beforeEach(() => {
    for (const m of Object.values(mocks)) m.mockReset();
    process.env.BULLMQ_ENABLED = 'true';
  });

  it('gate BULLMQ_ENABLED: skipa quando !=true', async () => {
    process.env.BULLMQ_ENABLED = 'false';
    await runPunchDailyDigestIfDue();
    expect(mocks.tenantFindMany).not.toHaveBeenCalled();
  });

  it('skipa tenant cuja hora local != 18', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-24T10:00:00.000Z')); // 07h BRT
    mocks.tenantFindMany.mockResolvedValue([
      { id: 'tenant-a', settings: { timezone: 'America/Sao_Paulo' } },
    ]);
    await runPunchDailyDigestIfDue();
    expect(mocks.redisSet).not.toHaveBeenCalled();
    expect(mocks.useCaseExecute).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('executa use case quando hora local == 18 e lock adquirido', async () => {
    vi.useFakeTimers();
    // 18h BRT = 21:00 UTC.
    vi.setSystemTime(new Date('2026-04-24T21:00:00.000Z'));
    mocks.tenantFindMany.mockResolvedValue([
      { id: 'tenant-a', settings: { timezone: 'America/Sao_Paulo' } },
    ]);
    mocks.redisSet.mockResolvedValue('OK');
    mocks.useCaseExecute.mockResolvedValue({
      pendingCount: 3,
      approvedCount: 2,
      missingCount: 1,
      dispatchedCount: 2,
      recipientUserIds: ['user-a', 'user-b'],
      adminCount: 1,
      managerCount: 1,
    });

    await runPunchDailyDigestIfDue();

    const redisArgs = mocks.redisSet.mock.calls[0];
    expect(redisArgs[0]).toMatch(
      /^punch:daily-digest:tenant-a:\d{4}-\d{2}-\d{2}$/,
    );
    expect(redisArgs[4]).toBe('NX');
    expect(mocks.useCaseExecute).toHaveBeenCalledTimes(1);
    // 2 recipients → 2 publish DAILY_DIGEST_SENT.
    expect(mocks.busPublish).toHaveBeenCalledTimes(2);
    const first = mocks.busPublish.mock.calls[0][0];
    expect(first.type).toBe('punch.daily-digest.sent');
    expect(first.data.recipientUserId).toBeOneOf(['user-a', 'user-b']);
    vi.useRealTimers();
  });

  it('skipa quando lock Redis já está taken', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-24T21:00:00.000Z'));
    mocks.tenantFindMany.mockResolvedValue([
      { id: 'tenant-a', settings: { timezone: 'America/Sao_Paulo' } },
    ]);
    mocks.redisSet.mockResolvedValue(null);
    await runPunchDailyDigestIfDue();
    expect(mocks.useCaseExecute).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('múltiplos tenants com timezones diferentes — apenas o que bate 18h é executado', async () => {
    vi.useFakeTimers();
    // 21:00 UTC = 18:00 BRT (UTC-3) MAS 22:00 em UTC+1.
    vi.setSystemTime(new Date('2026-04-24T21:00:00.000Z'));
    mocks.tenantFindMany.mockResolvedValue([
      { id: 'tenant-br', settings: { timezone: 'America/Sao_Paulo' } },
      { id: 'tenant-eu', settings: { timezone: 'Europe/Berlin' } },
    ]);
    mocks.redisSet.mockResolvedValue('OK');
    mocks.useCaseExecute.mockResolvedValue({
      pendingCount: 0,
      approvedCount: 0,
      missingCount: 0,
      dispatchedCount: 0,
      recipientUserIds: [],
      adminCount: 0,
      managerCount: 0,
    });

    await runPunchDailyDigestIfDue();

    // Só tenant-br deve rodar useCase.
    expect(mocks.useCaseExecute).toHaveBeenCalledTimes(1);
    expect(mocks.useCaseExecute.mock.calls[0][0].tenantId).toBe('tenant-br');
    vi.useRealTimers();
  });
});
