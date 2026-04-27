/**
 * Unit tests for missed-punch-notification-consumer
 *
 * Tests the pure processor function `processMissedPunchNotifications(job)`.
 * Uses vi.hoisted pattern (Phase 4-05 lesson) to mock dependencies:
 * - notificationClient.dispatch
 * - resolveEligibleManagerUserIds
 * - prisma.punchMissedLog.findMany
 *
 * Covers:
 * - Manager aggregation (1 dispatch per eligible manager, max 5 names)
 * - "+N mais" truncation when > 5 employees per manager
 * - Multi-manager routing (same employee under 2+ managers)
 * - Employee individual notifications
 * - Error isolation (Promise.allSettled prevents abort on 1 failure)
 * - Cross-tenant isolation (tenantId faithfully scoped)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import { PUNCH_EVENTS } from '@/lib/events/punch-events';
import type { PunchEventQueuePayload } from '@/lib/events/consumers/punch-events-queue-bridge';

// Hoisted mocks (vi.hoisted runs before module import)
const mocks = vi.hoisted(() => ({
  notificationClientDispatchMock: vi.fn(async () => ({
    notificationIds: ['notif-1'],
    recipientCount: 1,
    deduplicated: false,
    suppressedByPreference: 0,
  })),
  resolveEligibleManagerUserIdsMock: vi.fn(),
  prismaPunchMissedLogFindManyMock: vi.fn(),
  loggerInfoMock: vi.fn(),
  loggerWarnMock: vi.fn(),
  loggerDebugMock: vi.fn(),
}));

vi.mock('@/modules/notifications/public/client', () => ({
  notificationClient: {
    dispatch: mocks.notificationClientDispatchMock,
  },
}));

vi.mock('@/lib/websocket/hr-socket-scope', () => ({
  resolveEligibleManagerUserIds: mocks.resolveEligibleManagerUserIdsMock,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    punchMissedLog: {
      findMany: mocks.prismaPunchMissedLogFindManyMock,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfoMock,
    warn: mocks.loggerWarnMock,
    debug: mocks.loggerDebugMock,
  },
}));

const { processMissedPunchNotifications } =
  await import('./missed-punch-notification-consumer');

describe('processMissedPunchNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { processed: true, 0, 0 } when job type is not MISSED_PUNCHES_DETECTED', async () => {
    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: 'punch.something-else',
        tenantId: 'tenant-A',
        data: {},
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processMissedPunchNotifications(job);

    expect(result).toEqual({
      processed: true,
      managerDispatches: 0,
      employeeDispatches: 0,
    });
    expect(mocks.notificationClientDispatchMock).not.toHaveBeenCalled();
  });

  it('aggregates 5 employees under 1 manager + dispatches 1 manager + 5 employee notifs', async () => {
    const employeeData = [
      { id: 'emp-1', name: 'Ana', supervisorId: 'mgr-1', userId: 'user-emp-1' },
      {
        id: 'emp-2',
        name: 'Bruno',
        supervisorId: 'mgr-1',
        userId: 'user-emp-2',
      },
      {
        id: 'emp-3',
        name: 'Carla',
        supervisorId: 'mgr-1',
        userId: 'user-emp-3',
      },
      {
        id: 'emp-4',
        name: 'Diego',
        supervisorId: 'mgr-1',
        userId: 'user-emp-4',
      },
      {
        id: 'emp-5',
        name: 'Elena',
        supervisorId: 'mgr-1',
        userId: 'user-emp-5',
      },
    ];

    mocks.prismaPunchMissedLogFindManyMock.mockResolvedValue(
      employeeData.map((e) => ({
        id: `log-${e.id}`,
        employeeId: e.id,
        employee: e,
      })),
    );

    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue(['user-mgr-1']);

    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: PUNCH_EVENTS.MISSED_PUNCHES_DETECTED,
        tenantId: 'tenant-A',
        data: {
          tenantId: 'tenant-A',
          date: '2026-04-25',
          logIds: [
            'log-emp-1',
            'log-emp-2',
            'log-emp-3',
            'log-emp-4',
            'log-emp-5',
          ],
        },
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processMissedPunchNotifications(job);

    expect(result.processed).toBe(true);
    expect(result.managerDispatches).toBe(1); // 1 manager
    expect(result.employeeDispatches).toBe(5); // 5 employees

    // Verify manager dispatch includes aggregated names
    expect(mocks.notificationClientDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'punch.missed_punch_manager',
        recipients: { kind: 'user', userId: 'user-mgr-1' },
        body: expect.stringContaining('Ana, Bruno, Carla, Diego, Elena'),
      }),
    );

    // Verify individual employee dispatches
    expect(mocks.notificationClientDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'punch.missed_punch_employee',
        recipients: { kind: 'user', userId: 'user-emp-1' },
      }),
    );
  });

  it('truncates names to 5 + adds "+N mais" when > 5 employees per manager', async () => {
    const employeeData = Array.from({ length: 7 }, (_, i) => ({
      id: `emp-${i + 1}`,
      name: `Employee${i + 1}`,
      supervisorId: 'mgr-1',
      userId: `user-emp-${i + 1}`,
    }));

    mocks.prismaPunchMissedLogFindManyMock.mockResolvedValue(
      employeeData.map((e) => ({
        id: `log-${e.id}`,
        employeeId: e.id,
        employee: e,
      })),
    );

    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue(['user-mgr-1']);

    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: PUNCH_EVENTS.MISSED_PUNCHES_DETECTED,
        tenantId: 'tenant-A',
        data: {
          tenantId: 'tenant-A',
          date: '2026-04-25',
          logIds: employeeData.map((_, i) => `log-emp-${i + 1}`),
        },
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processMissedPunchNotifications(job);

    expect(result.managerDispatches).toBe(1);
    expect(result.employeeDispatches).toBe(7);

    // Check that body contains "+ 2 mais" (7 - 5)
    const managerDispatchCall =
      mocks.notificationClientDispatchMock.mock.calls.find(
        (call) => call[0].category === 'punch.missed_punch_manager',
      );
    expect(managerDispatchCall?.[0].body).toContain('e mais 2');
  });

  it('routes employees to different managers when they report to different supervisors', async () => {
    const employeeData = [
      { id: 'emp-1', name: 'Ana', supervisorId: 'mgr-1', userId: 'user-emp-1' },
      {
        id: 'emp-2',
        name: 'Bruno',
        supervisorId: 'mgr-2',
        userId: 'user-emp-2',
      },
    ];

    mocks.prismaPunchMissedLogFindManyMock.mockResolvedValue(
      employeeData.map((e) => ({
        id: `log-${e.id}`,
        employeeId: e.id,
        employee: e,
      })),
    );

    // emp-1 reports to mgr-1; emp-2 reports to mgr-2
    mocks.resolveEligibleManagerUserIdsMock.mockImplementation(
      async (_tenantId, employeeId) => {
        if (employeeId === 'emp-1') return ['user-mgr-1'];
        if (employeeId === 'emp-2') return ['user-mgr-2'];
        return [];
      },
    );

    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: PUNCH_EVENTS.MISSED_PUNCHES_DETECTED,
        tenantId: 'tenant-A',
        data: {
          tenantId: 'tenant-A',
          date: '2026-04-25',
          logIds: ['log-emp-1', 'log-emp-2'],
        },
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processMissedPunchNotifications(job);

    expect(result.managerDispatches).toBe(2); // 2 different managers
    expect(result.employeeDispatches).toBe(2); // 2 employees

    // Verify 2 manager dispatches with different recipients
    const managerCalls = mocks.notificationClientDispatchMock.mock.calls.filter(
      (call) => call[0].category === 'punch.missed_punch_manager',
    );
    expect(managerCalls.length).toBe(2);
    expect(managerCalls[0][0].recipients.userId).toBe('user-mgr-1');
    expect(managerCalls[1][0].recipients.userId).toBe('user-mgr-2');
  });

  it('continues when 1 dispatch fails (Promise.allSettled isolation)', async () => {
    const employeeData = [
      { id: 'emp-1', name: 'Ana', supervisorId: 'mgr-1', userId: 'user-emp-1' },
      {
        id: 'emp-2',
        name: 'Bruno',
        supervisorId: 'mgr-1',
        userId: 'user-emp-2',
      },
    ];

    mocks.prismaPunchMissedLogFindManyMock.mockResolvedValue(
      employeeData.map((e) => ({
        id: `log-${e.id}`,
        employeeId: e.id,
        employee: e,
      })),
    );

    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue(['user-mgr-1']);

    // First employee dispatch fails, second succeeds
    let callCount = 0;
    mocks.notificationClientDispatchMock.mockImplementation(async (input) => {
      callCount++;
      if (input.category === 'punch.missed_punch_employee' && callCount === 2) {
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
        type: PUNCH_EVENTS.MISSED_PUNCHES_DETECTED,
        tenantId: 'tenant-A',
        data: {
          tenantId: 'tenant-A',
          date: '2026-04-25',
          logIds: ['log-emp-1', 'log-emp-2'],
        },
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processMissedPunchNotifications(job);

    // Even though 1 dispatch failed, the other succeeds and is counted
    expect(result.managerDispatches).toBe(1);
    expect(result.employeeDispatches).toBe(1); // 1 succeeded, 1 failed

    // Verify warning was logged
    expect(mocks.loggerWarnMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('employee dispatch failed'),
    );
  });

  it('respects cross-tenant isolation: tenantId passed to all resolvers', async () => {
    const employeeData = [
      { id: 'emp-1', name: 'Ana', supervisorId: 'mgr-1', userId: 'user-emp-1' },
    ];

    mocks.prismaPunchMissedLogFindManyMock.mockResolvedValue(
      employeeData.map((e) => ({
        id: `log-${e.id}`,
        employeeId: e.id,
        employee: e,
      })),
    );

    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue(['user-mgr-1']);

    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: PUNCH_EVENTS.MISSED_PUNCHES_DETECTED,
        tenantId: 'tenant-B',
        data: {
          tenantId: 'tenant-B',
          date: '2026-04-25',
          logIds: ['log-emp-1'],
        },
      },
    } as unknown as Job<PunchEventQueuePayload>;

    await processMissedPunchNotifications(job);

    // Verify resolveEligibleManagerUserIds was called with tenant-B
    expect(mocks.resolveEligibleManagerUserIdsMock).toHaveBeenCalledWith(
      'tenant-B',
      'emp-1',
    );

    // Verify prisma query included tenantId filter
    expect(mocks.prismaPunchMissedLogFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-B' }),
      }),
    );

    // Verify dispatch was called with tenant-B
    expect(mocks.notificationClientDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-B' }),
    );
  });

  it('skips employees without user accounts (gracefully)', async () => {
    const employeeData = [
      {
        id: 'emp-1',
        name: 'Ana',
        supervisorId: 'mgr-1',
        userId: 'user-emp-1',
      },
      {
        id: 'emp-2-no-user',
        name: 'Bruno',
        supervisorId: 'mgr-1',
        userId: null, // Employee without user account
      },
    ];

    mocks.prismaPunchMissedLogFindManyMock.mockResolvedValue(
      employeeData.map((e) => ({
        id: `log-${e.id}`,
        employeeId: e.id,
        employee: e,
      })),
    );

    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue(['user-mgr-1']);

    const job = {
      id: 'job-1',
      data: {
        eventId: 'evt-1',
        type: PUNCH_EVENTS.MISSED_PUNCHES_DETECTED,
        tenantId: 'tenant-A',
        data: {
          tenantId: 'tenant-A',
          date: '2026-04-25',
          logIds: ['log-emp-1', 'log-emp-2-no-user'],
        },
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processMissedPunchNotifications(job);

    expect(result.managerDispatches).toBe(1); // manager dispatch still sent
    expect(result.employeeDispatches).toBe(1); // only 1 employee (without user skipped)

    // Manager dispatch includes both employee names
    expect(mocks.notificationClientDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'punch.missed_punch_manager',
        body: expect.stringContaining('Ana'),
      }),
    );
  });
});
