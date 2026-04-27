/**
 * E2E tests for missed punch notifications (Phase 9 / Plan 09-04)
 *
 * Located in the e2e controller path per vitest.config.mjs convention.
 * Tests the full end-to-end flow of punch notification consumers.
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

describe('[E2E] PUNCH-NOTIF-07 — missed punch notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches manager-aggregated notification for multiple employees', async () => {
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

    expect(result.processed).toBe(true);
    expect(result.managerDispatches).toBe(1);
    expect(result.employeeDispatches).toBe(3);

    const managerCalls = mocks.notificationClientDispatchMock.mock.calls.filter(
      (call) => call[0].category === 'punch.missed_punch_manager',
    );
    expect(managerCalls).toHaveLength(1);
    expect(managerCalls[0][0]).toMatchObject({
      tenantId: 'tenant-demo',
      recipients: { kind: 'user', userId: 'user-mgr-1' },
    });
  });

  it('cross-tenant isolation: tenant A events do not leak to tenant B', async () => {
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

    const allCalls = mocks.notificationClientDispatchMock.mock.calls;
    for (const [input] of allCalls) {
      expect(input.tenantId).toBe('tenant-B');
    }
  });
});
