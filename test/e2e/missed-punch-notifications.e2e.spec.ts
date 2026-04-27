/**
 * E2E tests for missed punch notifications (Phase 9 / Plan 09-04 — PUNCH-NOTIF-07)
 *
 * Tests the full end-to-end flow:
 * 1. MISSED_PUNCHES_DETECTED event is published to the queue
 * 2. punch-events-worker processes it via processMissedPunchNotifications
 * 3. Manager aggregated notification is dispatched (1 per manager, max 5 names)
 * 4. Employee individual notifications are dispatched
 *
 * Uses mocks for:
 * - notificationClient.dispatch (avoid external service calls in E2E)
 * - resolveEligibleManagerUserIds (BFS resolution)
 * - prisma (database queries)
 *
 * Real test substrate:
 * - processMissedPunchNotifications function logic
 * - Error isolation (Promise.allSettled)
 * - Cross-tenant scoping
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
  await import('@/workers/missed-punch-notification-consumer');

describe('PUNCH-NOTIF-07 — missed punch notifications end-to-end', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('e2e: dispatches manager-aggregated notification for multiple employees under same manager', async () => {
    // Setup: 3 employees under 1 manager
    const employees = [
      {
        id: 'emp-1',
        name: 'Ana Silva',
        supervisorId: 'mgr-1',
        userId: 'user-ana',
      },
      {
        id: 'emp-2',
        name: 'Bruno Oliveira',
        supervisorId: 'mgr-1',
        userId: 'user-bruno',
      },
      {
        id: 'emp-3',
        name: 'Carla Santos',
        supervisorId: 'mgr-1',
        userId: 'user-carla',
      },
    ];

    mocks.prismaPunchMissedLogFindManyMock.mockResolvedValue(
      employees.map((e) => ({
        id: `log-${e.id}`,
        employeeId: e.id,
        employee: e,
      })),
    );

    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue(['user-mgr-1']);

    const job = {
      id: 'job-detect-missed-1',
      data: {
        eventId: 'evt-detect-missed-1',
        type: PUNCH_EVENTS.MISSED_PUNCHES_DETECTED,
        tenantId: 'tenant-demo',
        source: 'cron',
        sourceEntityType: 'batch',
        sourceEntityId: 'batch-detect-missed-1',
        data: {
          tenantId: 'tenant-demo',
          date: '2026-04-25',
          logIds: employees.map((e) => `log-${e.id}`),
        },
        occurredAt: '2026-04-25T22:00:00Z',
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processMissedPunchNotifications(job);

    // Verify counts
    expect(result.processed).toBe(true);
    expect(result.managerDispatches).toBe(1); // 1 manager
    expect(result.employeeDispatches).toBe(3); // 3 employees

    // Verify manager dispatch called once with aggregated names
    const managerCalls = mocks.notificationClientDispatchMock.mock.calls.filter(
      (call) => call[0].category === 'punch.missed_punch_manager',
    );
    expect(managerCalls).toHaveLength(1);
    expect(managerCalls[0][0]).toMatchObject({
      tenantId: 'tenant-demo',
      recipients: { kind: 'user', userId: 'user-mgr-1' },
      body: expect.stringContaining('Ana Silva'),
    });

    // Verify 3 individual employee dispatches
    const employeeCalls =
      mocks.notificationClientDispatchMock.mock.calls.filter(
        (call) => call[0].category === 'punch.missed_punch_employee',
      );
    expect(employeeCalls).toHaveLength(3);
  });

  it('e2e: truncates to max 5 names + shows "+N mais" for larger groups', async () => {
    // Setup: 7 employees under 1 manager
    const employees = Array.from({ length: 7 }, (_, i) => ({
      id: `emp-${i + 1}`,
      name: `Employee${i + 1}`,
      supervisorId: 'mgr-1',
      userId: `user-emp-${i + 1}`,
    }));

    mocks.prismaPunchMissedLogFindManyMock.mockResolvedValue(
      employees.map((e) => ({
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
        tenantId: 'tenant-demo',
        source: 'cron',
        sourceEntityType: 'batch',
        sourceEntityId: 'batch-1',
        data: {
          tenantId: 'tenant-demo',
          date: '2026-04-25',
          logIds: employees.map((e) => `log-${e.id}`),
        },
        occurredAt: '2026-04-25T22:00:00Z',
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processMissedPunchNotifications(job);

    expect(result.managerDispatches).toBe(1);
    expect(result.employeeDispatches).toBe(7);

    // Verify "+2 mais" in body (7 - 5 = 2)
    const managerCall = mocks.notificationClientDispatchMock.mock.calls.find(
      (call) => call[0].category === 'punch.missed_punch_manager',
    );
    expect(managerCall?.[0].body).toContain('e mais 2');
  });

  it('e2e: cross-tenant isolation — tenant-A notifications do not leak to tenant-B', async () => {
    // Setup: simulate event for tenant-B
    const employees = [
      { id: 'emp-1', name: 'João', supervisorId: 'mgr-1', userId: 'user-joao' },
    ];

    mocks.prismaPunchMissedLogFindManyMock.mockResolvedValue(
      employees.map((e) => ({
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
        source: 'cron',
        sourceEntityType: 'batch',
        sourceEntityId: 'batch-1',
        data: {
          tenantId: 'tenant-B',
          date: '2026-04-25',
          logIds: ['log-emp-1'],
        },
        occurredAt: '2026-04-25T22:00:00Z',
      },
    } as unknown as Job<PunchEventQueuePayload>;

    await processMissedPunchNotifications(job);

    // Verify all dispatches use tenant-B
    const allCalls = mocks.notificationClientDispatchMock.mock.calls;
    for (const [input] of allCalls) {
      expect(input.tenantId).toBe('tenant-B');
    }

    // Verify resolveEligibleManagerUserIds was called with tenant-B
    expect(mocks.resolveEligibleManagerUserIdsMock).toHaveBeenCalledWith(
      'tenant-B',
      'emp-1',
    );

    // Verify prisma query scoped to tenant-B
    expect(mocks.prismaPunchMissedLogFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-B' }),
      }),
    );
  });

  it('e2e: handles error gracefully when 1 dispatch fails (isolation + continuation)', async () => {
    // Setup: 2 employees under 1 manager; 1 dispatch will fail
    const employees = [
      { id: 'emp-1', name: 'Ana', supervisorId: 'mgr-1', userId: 'user-ana' },
      {
        id: 'emp-2',
        name: 'Bruno',
        supervisorId: 'mgr-1',
        userId: 'user-bruno',
      },
    ];

    mocks.prismaPunchMissedLogFindManyMock.mockResolvedValue(
      employees.map((e) => ({
        id: `log-${e.id}`,
        employeeId: e.id,
        employee: e,
      })),
    );

    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue(['user-mgr-1']);

    // Make 2nd dispatch fail
    let callIdx = 0;
    mocks.notificationClientDispatchMock.mockImplementation(async (input) => {
      callIdx++;
      if (input.category === 'punch.missed_punch_employee' && callIdx === 2) {
        throw new Error('Device offline');
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
        tenantId: 'tenant-demo',
        source: 'cron',
        sourceEntityType: 'batch',
        sourceEntityId: 'batch-1',
        data: {
          tenantId: 'tenant-demo',
          date: '2026-04-25',
          logIds: ['log-emp-1', 'log-emp-2'],
        },
        occurredAt: '2026-04-25T22:00:00Z',
      },
    } as unknown as Job<PunchEventQueuePayload>;

    const result = await processMissedPunchNotifications(job);

    // Even though 1 dispatch failed, manager + 1 employee succeed
    expect(result.managerDispatches).toBe(1);
    expect(result.employeeDispatches).toBe(1); // 1 succeeded, 1 failed

    // Verify warning logged
    expect(mocks.loggerWarnMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('employee dispatch failed'),
    );
  });
});
