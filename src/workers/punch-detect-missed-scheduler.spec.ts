import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks (pattern Plan 04-05 / 07-04) ───────────────────────────
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
  prisma: {
    tenant: { findMany: mocks.tenantFindMany },
  },
}));

vi.mock('@/lib/redis', () => ({
  getRedisClient: () => ({
    set: mocks.redisSet,
  }),
}));

vi.mock('@/lib/events', () => ({
  getTypedEventBus: () => ({
    publish: mocks.busPublish,
  }),
}));

vi.mock(
  '@/use-cases/hr/punch-dashboard/factories/make-detect-missed-punches',
  () => ({
    makeDetectMissedPunchesUseCase: () => ({ execute: mocks.useCaseExecute }),
  }),
);

import { runPunchDetectMissedIfDue } from './punch-detect-missed-scheduler';

describe('runPunchDetectMissedIfDue', () => {
  beforeEach(() => {
    for (const m of Object.values(mocks)) m.mockReset();
    process.env.BULLMQ_ENABLED = 'true';
  });

  it('gate BULLMQ_ENABLED: quando !=true, skipa (tenant.findMany nem é chamado)', async () => {
    process.env.BULLMQ_ENABLED = 'false';
    await runPunchDetectMissedIfDue();
    expect(mocks.tenantFindMany).not.toHaveBeenCalled();
  });

  it('skipa tenant cuja hora local != 22', async () => {
    // Mock agora vai ser o "now" real. Para forçar hora != 22, usamos fake
    // timer em 10:00 UTC no timezone America/Sao_Paulo (UTC-3) = 07h local.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-24T10:00:00.000Z')); // 07h em BRT
    mocks.tenantFindMany.mockResolvedValue([
      {
        id: 'tenant-a',
        settings: { timezone: 'America/Sao_Paulo' },
      },
    ]);

    await runPunchDetectMissedIfDue();

    expect(mocks.redisSet).not.toHaveBeenCalled();
    expect(mocks.useCaseExecute).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('executa use case quando hora local == 22 e lock adquirido', async () => {
    vi.useFakeTimers();
    // 22h em America/Sao_Paulo (UTC-3) → 01:00 UTC do dia seguinte.
    vi.setSystemTime(new Date('2026-04-25T01:00:00.000Z'));
    mocks.tenantFindMany.mockResolvedValue([
      { id: 'tenant-a', settings: { timezone: 'America/Sao_Paulo' } },
    ]);
    mocks.redisSet.mockResolvedValue('OK');
    mocks.useCaseExecute.mockResolvedValue({
      detected: 2,
      createdLogIds: ['l-1', 'l-2'],
      skippedExisting: 0,
      skippedEmployees: 3,
      holidaySkipped: false,
    });

    await runPunchDetectMissedIfDue();

    expect(mocks.redisSet).toHaveBeenCalledTimes(1);
    const redisArgs = mocks.redisSet.mock.calls[0];
    expect(redisArgs[0]).toMatch(
      /^punch:detect-missed:tenant-a:\d{4}-\d{2}-\d{2}$/,
    );
    expect(redisArgs[2]).toBe('EX');
    expect(redisArgs[4]).toBe('NX');
    expect(mocks.useCaseExecute).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      date: expect.any(Date),
    });
    expect(mocks.busPublish).toHaveBeenCalledTimes(1);
    const payload = mocks.busPublish.mock.calls[0][0];
    expect(payload.type).toBe('punch.missed-punches.detected');
    expect(payload.data.count).toBe(2);
    vi.useRealTimers();
  });

  it('skipa quando lock Redis já está taken (SETNX retorna null)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T01:00:00.000Z'));
    mocks.tenantFindMany.mockResolvedValue([
      { id: 'tenant-a', settings: { timezone: 'America/Sao_Paulo' } },
    ]);
    mocks.redisSet.mockResolvedValue(null); // lock taken

    await runPunchDetectMissedIfDue();

    expect(mocks.useCaseExecute).not.toHaveBeenCalled();
    expect(mocks.busPublish).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('fallback timezone America/Sao_Paulo quando settings.timezone undefined', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T01:00:00.000Z'));
    mocks.tenantFindMany.mockResolvedValue([{ id: 'tenant-a', settings: {} }]);
    mocks.redisSet.mockResolvedValue('OK');
    mocks.useCaseExecute.mockResolvedValue({
      detected: 0,
      createdLogIds: [],
      skippedExisting: 0,
      skippedEmployees: 0,
      holidaySkipped: false,
    });

    await runPunchDetectMissedIfDue();

    expect(mocks.useCaseExecute).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('erro no useCase de 1 tenant não bloqueia os próximos', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T01:00:00.000Z'));
    mocks.tenantFindMany.mockResolvedValue([
      { id: 'tenant-a', settings: { timezone: 'America/Sao_Paulo' } },
      { id: 'tenant-b', settings: { timezone: 'America/Sao_Paulo' } },
    ]);
    mocks.redisSet.mockResolvedValue('OK');
    mocks.useCaseExecute
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        detected: 1,
        createdLogIds: ['l-x'],
        skippedExisting: 0,
        skippedEmployees: 0,
        holidaySkipped: false,
      });

    await runPunchDetectMissedIfDue();

    expect(mocks.useCaseExecute).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
