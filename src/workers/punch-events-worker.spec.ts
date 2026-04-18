import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PunchEventQueuePayload } from '@/lib/events/consumers/punch-events-queue-bridge';

// Hoisted so vi.mock's factory captures a stable reference.
const mocks = vi.hoisted(() => ({
  createWorkerMock: vi.fn(),
  loggerInfoMock: vi.fn(),
}));

vi.mock('@/lib/queue', () => ({
  QUEUE_NAMES: {
    PUNCH_EVENTS: 'punch-events',
  },
  createWorker: mocks.createWorkerMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfoMock,
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const { startPunchEventsWorker } = await import('./punch-events-worker');

describe('punch-events worker (MOCK handler, phase 4)', () => {
  beforeEach(() => {
    mocks.createWorkerMock.mockClear();
    mocks.createWorkerMock.mockReturnValue({
      close: vi.fn().mockResolvedValue(undefined),
    });
    mocks.loggerInfoMock.mockClear();
  });

  it('registers the worker against QUEUE_NAMES.PUNCH_EVENTS', () => {
    startPunchEventsWorker();

    expect(mocks.createWorkerMock).toHaveBeenCalledTimes(1);
    const [queueName] = mocks.createWorkerMock.mock.calls[0];
    expect(queueName).toBe('punch-events');
  });

  it('sets low-concurrency limits appropriate for a mock handler', () => {
    startPunchEventsWorker();

    const [, , options] = mocks.createWorkerMock.mock.calls[0];
    expect(options).toMatchObject({
      concurrency: 2,
      limiter: { max: 100, duration: 1000 },
    });
  });

  it('handler returns { processed: true } on successful job execution', async () => {
    // Silence the lazy-loaded console fallback logger so the test output
    // stays clean when vi.mock('@/lib/logger') does not intercept the
    // worker's internal require() (the worker uses a lazy-logger pattern).
    const consoleLogSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);

    startPunchEventsWorker();

    const [, processor] = mocks.createWorkerMock.mock.calls[0];
    const jobData: PunchEventQueuePayload = {
      eventId: 'evt-1',
      type: 'punch.time-entry.created',
      tenantId: 'tenant-1',
      source: 'hr',
      sourceEntityType: 'time_entry',
      sourceEntityId: 'te-1',
      data: { timeEntryId: 'te-1', employeeId: 'emp-1' },
      occurredAt: '2026-04-18T12:00:00Z',
    };
    const fakeJob = { id: 'job-1', data: jobData } as unknown as Parameters<
      typeof processor
    >[0];

    const result = await processor(fakeJob);

    expect(result).toEqual({ processed: true });

    consoleLogSpy.mockRestore();
  });

  it('handler succeeds for every PUNCH_EVENTS variant (log-only)', async () => {
    const consoleLogSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);

    startPunchEventsWorker();
    const [, processor] = mocks.createWorkerMock.mock.calls[0];

    const types = [
      'punch.time-entry.created',
      'punch.approval.requested',
      'punch.approval.resolved',
      'punch.device.paired',
      'punch.device.revoked',
    ];

    for (const type of types) {
      const fakeJob = {
        id: `job-${type}`,
        data: {
          eventId: `evt-${type}`,
          type,
          tenantId: 'tenant-1',
          source: 'hr',
          sourceEntityType: 'time_entry',
          sourceEntityId: 'te-1',
          data: {},
          occurredAt: new Date().toISOString(),
        } as PunchEventQueuePayload,
      } as unknown as Parameters<typeof processor>[0];

      await expect(processor(fakeJob)).resolves.toEqual({ processed: true });
    }

    consoleLogSpy.mockRestore();
  });
});
