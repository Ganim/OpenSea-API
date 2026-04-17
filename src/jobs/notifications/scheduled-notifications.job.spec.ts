import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const useCaseExecuteSpy = vi.fn();
vi.mock(
  '@/use-cases/notifications/factories/make-process-scheduled-notifications-use-case',
  () => ({
    makeProcessScheduledNotificationsUseCase: () => ({
      execute: useCaseExecuteSpy,
    }),
  }),
);

import { runScheduledNotificationsJob } from './scheduled-notifications.job';

describe('runScheduledNotificationsJob (P3-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCaseExecuteSpy.mockReset();
  });

  it('collapses the sent[] array into its length and returns counts', async () => {
    useCaseExecuteSpy.mockResolvedValueOnce({
      processed: 5,
      sent: [{ id: '1' }, { id: '2' }, { id: '3' }],
      errors: 1,
    });

    const result = await runScheduledNotificationsJob();

    expect(result).toEqual({ processed: 5, sent: 3, errors: 1 });
  });

  it('rethrows use-case errors so BullMQ can retry / DLQ', async () => {
    useCaseExecuteSpy.mockRejectedValueOnce(new Error('smtp down'));

    await expect(
      runScheduledNotificationsJob({ trigger: 'cron' }),
    ).rejects.toThrow('smtp down');
  });

  it('accepts an injected factory for DI', async () => {
    const execute = vi.fn().mockResolvedValue({
      processed: 2,
      sent: [{ id: 'x' }, { id: 'y' }],
      errors: 0,
    });

    const result = await runScheduledNotificationsJob(
      { trigger: 'manual' },
      { factory: () => ({ execute }) },
    );

    expect(execute).toHaveBeenCalledTimes(1);
    expect(useCaseExecuteSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ processed: 2, sent: 2, errors: 0 });
  });

  it('returns zeros silently when nothing is due', async () => {
    useCaseExecuteSpy.mockResolvedValueOnce({
      processed: 0,
      sent: [],
      errors: 0,
    });

    const result = await runScheduledNotificationsJob();

    expect(result).toEqual({ processed: 0, sent: 0, errors: 0 });
  });
});
