/**
 * Unit tests for face-match-fail-3x-notification-consumer
 *
 * Tests the pure processor function `processFaceMatchFail3xNotification(job)`.
 * Uses vi.hoisted pattern to mock dependencies:
 * - notificationClient.dispatch
 * - resolveEligibleManagerUserIds
 *
 * Covers:
 * - Manager resolution and dispatch (1 notif per eligible manager)
 * - ACTIONABLE type with actionUrl to audit detail view
 * - Non-matching event types (pass-through)
 * - Graceful handling when no managers found
 * - Error isolation (Promise.allSettled)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import { PUNCH_EVENTS } from '@/lib/events/punch-events';
import type { PunchEventQueuePayload } from '@/lib/events/consumers/punch-events-queue-bridge';

const mocks = vi.hoisted(() => ({
  notificationClientDispatchMock: vi.fn(async () => ({
    notificationIds: ['notif-1'],
    recipientCount: 1,
    deduplicated: false,
    suppressedByPreference: 0,
  })),
  resolveEligibleManagerUserIdsMock: vi.fn(),
  loggerInfoMock: vi.fn(),
  loggerWarnMock: vi.fn(),
}));

vi.mock('@/modules/notifications/public/client', () => ({
  notificationClient: {
    dispatch: mocks.notificationClientDispatchMock,
  },
}));

vi.mock('@/lib/websocket/hr-socket-scope', () => ({
  resolveEligibleManagerUserIds: mocks.resolveEligibleManagerUserIdsMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfoMock,
    warn: mocks.loggerWarnMock,
    debug: vi.fn(),
  },
}));

const { processFaceMatchFail3xNotification } =
  await import('./face-match-fail-3x-notification-consumer');

describe('processFaceMatchFail3xNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { processed: true, dispatched: 0 } when job type is not FACE_MATCH_FAIL_3X', async () => {
    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: 'punch.time-entry.created',
        tenantId: 'tenant-A',
        data: {},
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processFaceMatchFail3xNotification(job);

    expect(result).toEqual({ processed: true, dispatched: 0 });
    expect(mocks.notificationClientDispatchMock).not.toHaveBeenCalled();
  });

  it('dispatches ACTIONABLE notification to 1 eligible manager', async () => {
    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue(['user-mgr-1']);

    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: PUNCH_EVENTS.FACE_MATCH_FAIL_3X,
        tenantId: 'tenant-A',
        data: {
          approvalId: 'appr-1',
          tenantId: 'tenant-A',
          employeeId: 'emp-1',
          employeeName: 'João Silva',
          failureCount: 3,
          windowMinutes: 60,
          triggeredAt: '2026-04-25T14:30:00Z',
        },
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processFaceMatchFail3xNotification(job);

    expect(result.processed).toBe(true);
    expect(result.dispatched).toBe(1);

    expect(mocks.notificationClientDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'punch.face_match_alert',
        type: 'ACTIONABLE',
        recipients: { kind: 'user', userId: 'user-mgr-1' },
        title: 'Alerta: 3 falhas consecutivas de face match',
        body: expect.stringContaining('João Silva'),
        actionUrl: '/hr/punch/audit?id=appr-1',
      }),
    );
  });

  it('passes tenantId to resolveEligibleManagerUserIds', async () => {
    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue(['user-mgr-1']);

    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: PUNCH_EVENTS.FACE_MATCH_FAIL_3X,
        tenantId: 'tenant-B',
        data: {
          approvalId: 'appr-1',
          tenantId: 'tenant-B',
          employeeId: 'emp-1',
          employeeName: 'João Silva',
          failureCount: 3,
          windowMinutes: 60,
          triggeredAt: '2026-04-25T14:30:00Z',
        },
      },
    } as unknown as Job<PunchEventQueuePayload>;

    await processFaceMatchFail3xNotification(job);

    expect(mocks.resolveEligibleManagerUserIdsMock).toHaveBeenCalledWith(
      'tenant-B',
      'emp-1',
    );

    expect(mocks.notificationClientDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-B',
      }),
    );
  });

  it('dispatches to multiple managers when hierarchy is complex', async () => {
    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue([
      'user-mgr-1',
      'user-mgr-2-delegate',
      'user-hr-admin',
    ]);

    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: PUNCH_EVENTS.FACE_MATCH_FAIL_3X,
        tenantId: 'tenant-A',
        data: {
          approvalId: 'appr-1',
          tenantId: 'tenant-A',
          employeeId: 'emp-1',
          employeeName: 'João Silva',
          failureCount: 3,
          windowMinutes: 60,
          triggeredAt: '2026-04-25T14:30:00Z',
        },
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processFaceMatchFail3xNotification(job);

    expect(result.dispatched).toBe(3);

    const calls = mocks.notificationClientDispatchMock.mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls[0][0].recipients.userId).toBe('user-mgr-1');
    expect(calls[1][0].recipients.userId).toBe('user-mgr-2-delegate');
    expect(calls[2][0].recipients.userId).toBe('user-hr-admin');
  });

  it('returns { dispatched: 0 } when no managers found and logs warning', async () => {
    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue([]);

    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: PUNCH_EVENTS.FACE_MATCH_FAIL_3X,
        tenantId: 'tenant-A',
        data: {
          approvalId: 'appr-1',
          tenantId: 'tenant-A',
          employeeId: 'emp-1',
          employeeName: 'João Silva',
          failureCount: 3,
          windowMinutes: 60,
          triggeredAt: '2026-04-25T14:30:00Z',
        },
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processFaceMatchFail3xNotification(job);

    expect(result.dispatched).toBe(0);
    expect(mocks.notificationClientDispatchMock).not.toHaveBeenCalled();
    expect(mocks.loggerWarnMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('no eligible managers found'),
    );
  });

  it('continues when 1 manager dispatch fails (Promise.allSettled isolation)', async () => {
    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue([
      'user-mgr-1',
      'user-mgr-2',
    ]);

    let callCount = 0;
    mocks.notificationClientDispatchMock.mockImplementation(async (input) => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Network error');
      }
      return {
        notificationIds: ['notif-1'],
        recipientCount: 1,
        deduplicated: false,
        suppressedByPreference: 0,
      };
    });

    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: PUNCH_EVENTS.FACE_MATCH_FAIL_3X,
        tenantId: 'tenant-A',
        data: {
          approvalId: 'appr-1',
          tenantId: 'tenant-A',
          employeeId: 'emp-1',
          employeeName: 'João Silva',
          failureCount: 3,
          windowMinutes: 60,
          triggeredAt: '2026-04-25T14:30:00Z',
        },
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processFaceMatchFail3xNotification(job);

    // 1 succeeded, 1 failed
    expect(result.dispatched).toBe(1);

    // Verify warning was logged for the failed dispatch
    expect(mocks.loggerWarnMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('dispatch failed'),
    );
  });

  it('includes approval ID in actionUrl for audit navigation', async () => {
    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue(['user-mgr-1']);

    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: PUNCH_EVENTS.FACE_MATCH_FAIL_3X,
        tenantId: 'tenant-A',
        data: {
          approvalId: 'appr-12345',
          tenantId: 'tenant-A',
          employeeId: 'emp-1',
          employeeName: 'João Silva',
          failureCount: 3,
          windowMinutes: 60,
          triggeredAt: '2026-04-25T14:30:00Z',
        },
      },
    } as unknown as Job<PunchEventQueuePayload>;

    await processFaceMatchFail3xNotification(job);

    expect(mocks.notificationClientDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actionUrl: '/hr/punch/audit?id=appr-12345',
      }),
    );
  });
});
