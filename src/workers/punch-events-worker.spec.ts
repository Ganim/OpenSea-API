import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PunchEventQueuePayload } from '@/lib/events/consumers/punch-events-queue-bridge';
import { PUNCH_EVENTS } from '@/lib/events/punch-events';

// Hoisted so vi.mock's factory captures a stable reference.
const mocks = vi.hoisted(() => ({
  createWorkerMock: vi.fn(),
  loggerInfoMock: vi.fn(),
  processMissedPunchNotificationsMock: vi.fn(async () => ({
    processed: true,
    managerDispatches: 1,
    employeeDispatches: 5,
  })),
  processFaceMatchFail3xNotificationMock: vi.fn(async () => ({
    processed: true,
    dispatched: 1,
  })),
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

vi.mock('./missed-punch-notification-consumer', () => ({
  processMissedPunchNotifications: mocks.processMissedPunchNotificationsMock,
}));

vi.mock('./face-match-fail-3x-notification-consumer', () => ({
  processFaceMatchFail3xNotification:
    mocks.processFaceMatchFail3xNotificationMock,
}));

const { startPunchEventsWorker } = await import('./punch-events-worker');

describe('punch-events worker (MOCK handler, phase 4)', () => {
  beforeEach(() => {
    mocks.createWorkerMock.mockClear();
    mocks.createWorkerMock.mockReturnValue({
      close: vi.fn().mockResolvedValue(undefined),
    });
    mocks.loggerInfoMock.mockClear();
    mocks.processMissedPunchNotificationsMock.mockClear();
    mocks.processFaceMatchFail3xNotificationMock.mockClear();
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

  // Phase 9 Plan 09-04: switch-based dispatcher tests
  describe('event type dispatch (switch handler — Phase 9)', () => {
    it('routes MISSED_PUNCHES_DETECTED to processMissedPunchNotifications', async () => {
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);

      startPunchEventsWorker();
      const [, processor] = mocks.createWorkerMock.mock.calls[0];

      const fakeJob = {
        id: 'job-1',
        data: {
          eventId: 'evt-1',
          type: PUNCH_EVENTS.MISSED_PUNCHES_DETECTED,
          tenantId: 'tenant-A',
          source: 'cron',
          sourceEntityType: 'batch',
          sourceEntityId: 'batch-1',
          data: {
            tenantId: 'tenant-A',
            date: '2026-04-25',
            logIds: ['log-1', 'log-2'],
          },
          occurredAt: new Date().toISOString(),
        } as PunchEventQueuePayload,
      } as unknown as Parameters<typeof processor>[0];

      const result = await processor(fakeJob);

      expect(mocks.processMissedPunchNotificationsMock).toHaveBeenCalledWith(
        fakeJob,
      );
      expect(result).toEqual({
        processed: true,
        managerDispatches: 1,
        employeeDispatches: 5,
      });

      consoleLogSpy.mockRestore();
    });

    it('routes FACE_MATCH_FAIL_3X to processFaceMatchFail3xNotification', async () => {
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);

      startPunchEventsWorker();
      const [, processor] = mocks.createWorkerMock.mock.calls[0];

      const fakeJob = {
        id: 'job-1',
        data: {
          eventId: 'evt-1',
          type: PUNCH_EVENTS.FACE_MATCH_FAIL_3X,
          tenantId: 'tenant-A',
          source: 'punch',
          sourceEntityType: 'approval',
          sourceEntityId: 'appr-1',
          data: {
            approvalId: 'appr-1',
            tenantId: 'tenant-A',
            employeeId: 'emp-1',
            employeeName: 'João Silva',
            failureCount: 3,
            windowMinutes: 60,
            triggeredAt: '2026-04-25T14:30:00Z',
          },
          occurredAt: new Date().toISOString(),
        } as PunchEventQueuePayload,
      } as unknown as Parameters<typeof processor>[0];

      const result = await processor(fakeJob);

      expect(mocks.processFaceMatchFail3xNotificationMock).toHaveBeenCalledWith(
        fakeJob,
      );
      expect(result).toEqual({
        processed: true,
        dispatched: 1,
      });

      consoleLogSpy.mockRestore();
    });

    it('falls through to MOCK { processed: true } for unknown event types', async () => {
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);

      startPunchEventsWorker();
      const [, processor] = mocks.createWorkerMock.mock.calls[0];

      const fakeJob = {
        id: 'job-1',
        data: {
          eventId: 'evt-1',
          type: 'punch.unknown.event',
          tenantId: 'tenant-A',
          source: 'test',
          sourceEntityType: 'test',
          sourceEntityId: 'test-1',
          data: {},
          occurredAt: new Date().toISOString(),
        } as PunchEventQueuePayload,
      } as unknown as Parameters<typeof processor>[0];

      const result = await processor(fakeJob);

      expect(mocks.processMissedPunchNotificationsMock).not.toHaveBeenCalled();
      expect(
        mocks.processFaceMatchFail3xNotificationMock,
      ).not.toHaveBeenCalled();
      expect(result).toEqual({ processed: true });

      consoleLogSpy.mockRestore();
    });
  });
});
