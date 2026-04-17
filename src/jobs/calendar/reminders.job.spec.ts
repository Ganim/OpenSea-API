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
  '@/use-cases/calendar/events/factories/make-process-due-reminders-use-case',
  () => ({
    makeProcessDueRemindersUseCase: () => ({ execute: useCaseExecuteSpy }),
  }),
);

import { runCalendarRemindersJob } from './reminders.job';

describe('runCalendarRemindersJob (P3-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCaseExecuteSpy.mockReset();
  });

  it('returns processed + errors counts from the use case', async () => {
    useCaseExecuteSpy.mockResolvedValueOnce({ processed: 7, errors: 2 });

    const result = await runCalendarRemindersJob();

    expect(useCaseExecuteSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ processed: 7, errors: 2 });
  });

  it('rethrows use-case errors so BullMQ can retry / DLQ', async () => {
    useCaseExecuteSpy.mockRejectedValueOnce(new Error('db down'));

    await expect(runCalendarRemindersJob({ trigger: 'cron' })).rejects.toThrow(
      'db down',
    );
  });

  it('accepts an injected factory for DI (no logger/prisma coupling in tests)', async () => {
    const execute = vi.fn().mockResolvedValue({ processed: 3, errors: 0 });

    const result = await runCalendarRemindersJob(
      { trigger: 'manual' },
      { factory: () => ({ execute }) },
    );

    expect(execute).toHaveBeenCalledTimes(1);
    expect(useCaseExecuteSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ processed: 3, errors: 0 });
  });

  it('returns zero counts silently when there is nothing due', async () => {
    useCaseExecuteSpy.mockResolvedValueOnce({ processed: 0, errors: 0 });

    const result = await runCalendarRemindersJob();

    expect(result).toEqual({ processed: 0, errors: 0 });
  });
});
