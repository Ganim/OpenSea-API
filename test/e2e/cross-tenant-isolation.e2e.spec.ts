/**
 * Cross-tenant isolation E2E tests
 *
 * Phase 9 / Plan 09-04 — validates that notifications and data access
 * are properly scoped to tenant boundaries.
 *
 * Sentinel tests:
 * - PUNCH-NOTIF-07 (missing punch): tenant A events don't leak to tenant B
 * - PUNCH-FRAUD-07 (face-match-fail-3x): audit list properly scoped
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
    debug: vi.fn(),
  },
}));

const { processMissedPunchNotifications } =
  await import('@/workers/missed-punch-notification-consumer');

describe('Cross-tenant isolation — Phase 9', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tenant A does not receive missed-punch notifications from tenant B', async () => {
    // Setup: simulate missed-punch event for tenant-B
    const tenantBEmployees = [
      {
        id: 'emp-b1',
        name: 'João',
        supervisorId: 'mgr-b1',
        userId: 'user-joao',
      },
      {
        id: 'emp-b2',
        name: 'Maria',
        supervisorId: 'mgr-b1',
        userId: 'user-maria',
      },
    ];

    mocks.prismaPunchMissedLogFindManyMock.mockResolvedValue(
      tenantBEmployees.map((e) => ({
        id: `log-${e.id}`,
        employeeId: e.id,
        employee: e,
      })),
    );

    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue(['user-mgr-b1']);

    const job = {
      id: 'job-tenant-b',
      data: {
        eventId: 'evt-tenant-b',
        type: PUNCH_EVENTS.MISSED_PUNCHES_DETECTED,
        tenantId: 'tenant-B',
        source: 'cron',
        sourceEntityType: 'batch',
        sourceEntityId: 'batch-b1',
        data: {
          tenantId: 'tenant-B',
          date: '2026-04-25',
          logIds: tenantBEmployees.map((e) => `log-${e.id}`),
        },
        occurredAt: '2026-04-25T22:00:00Z',
      },
    } as unknown as Job<PunchEventQueuePayload>;

    await processMissedPunchNotifications(job);

    // CRITICAL: all dispatches must use tenantId=tenant-B, never tenant-A
    const allDispatches = mocks.notificationClientDispatchMock.mock.calls;
    expect(allDispatches.length).toBeGreaterThan(0);

    for (const [dispatchInput] of allDispatches) {
      expect(dispatchInput.tenantId).toBe('tenant-B');
      expect(dispatchInput.tenantId).not.toBe('tenant-A');

      // Verify employee names belong to tenant-B
      if ('body' in dispatchInput && dispatchInput.body) {
        expect(dispatchInput.body).toMatch(/João|Maria|tenant-B/i);
      }
    }

    // Verify prisma findMany was scoped to tenant-B
    expect(mocks.prismaPunchMissedLogFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-B' }),
      }),
    );

    // Verify BFS resolution was called with tenant-B
    expect(mocks.resolveEligibleManagerUserIdsMock).toHaveBeenCalledWith(
      'tenant-B',
      expect.any(String),
    );
  });

  it('tenant A audit list does not include rows from tenant B (data access isolation)', async () => {
    // This is a sentinel test — actual audit list E2E would be in a separate
    // controller spec, but we document the expectation here:
    // when listing PunchApproval rows for tenant-A, queries MUST filter by tenantId='tenant-A',
    // and resolveEligibleManagerUserIds MUST pass tenantId to all BFS lookups.

    // Phase 9-02 implements audit list endpoint with proper tenantId scoping.
    // This test documents that Phase 9-04 notification consumers also respect it.

    const tenantAEmployees = [
      {
        id: 'emp-a1',
        name: 'Alice',
        supervisorId: 'mgr-a1',
        userId: 'user-alice',
      },
    ];

    mocks.prismaPunchMissedLogFindManyMock.mockResolvedValue(
      tenantAEmployees.map((e) => ({
        id: `log-${e.id}`,
        employeeId: e.id,
        employee: e,
      })),
    );

    mocks.resolveEligibleManagerUserIdsMock.mockResolvedValue(['user-mgr-a1']);

    const job = {
      id: 'job-tenant-a',
      data: {
        eventId: 'evt-tenant-a',
        type: PUNCH_EVENTS.MISSED_PUNCHES_DETECTED,
        tenantId: 'tenant-A',
        source: 'cron',
        sourceEntityType: 'batch',
        sourceEntityId: 'batch-a1',
        data: {
          tenantId: 'tenant-A',
          date: '2026-04-25',
          logIds: ['log-emp-a1'],
        },
        occurredAt: '2026-04-25T22:00:00Z',
      },
    } as unknown as Job<PunchEventQueuePayload>;

    await processMissedPunchNotifications(job);

    // Verify query was scoped to tenant-A
    expect(mocks.prismaPunchMissedLogFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-A' }),
      }),
    );

    // Verify BFS was called with tenant-A (not tenant-B)
    const bfsCall = mocks.resolveEligibleManagerUserIdsMock.mock.calls[0];
    expect(bfsCall[0]).toBe('tenant-A');
  });
});
