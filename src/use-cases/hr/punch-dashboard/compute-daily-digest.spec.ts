import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationChannel } from '@/modules/notifications/public/types';

import {
  ComputeDailyDigestUseCase,
  type DailyDigestNotificationClient,
  type DailyDigestPrisma,
} from './compute-daily-digest';

function makeMocks({
  pending = 0,
  approved = 0,
  missing = 0,
  adminGroups = [] as Array<Array<string>>,
  subordinates = [] as Array<{ supervisorId: string; userId: string | null }>,
  managerLookup = [] as Array<{ id: string; userId: string | null }>,
}) {
  const prisma: DailyDigestPrisma = {
    punchApproval: {
      count: vi.fn(async (args) => {
        const where = args.where as { status?: string; resolvedAt?: unknown };
        if (where.status === 'PENDING') return pending;
        if (where.status === 'APPROVED') return approved;
        return 0;
      }),
    },
    punchMissedLog: {
      count: vi.fn(async () => missing),
    },
    permissionGroup: {
      findMany: vi.fn(async () =>
        adminGroups.map((userIds) => ({
          users: userIds.map((userId) => ({ userId })),
        })),
      ),
    },
    employee: {
      findMany: vi.fn(async (args) => {
        const w = args.where as {
          supervisorId?: { not?: null };
          id?: { in?: string[] };
        };
        if (w.supervisorId) {
          // First call — subordinates.
          return subordinates.map((s) => ({
            supervisorId: s.supervisorId,
            userId: s.userId,
          }));
        }
        if (w.id?.in) {
          // Second call — resolve supervisor userIds by id.
          return managerLookup
            .filter((m) => (w.id!.in as string[]).includes(m.id))
            .map((m) => ({ supervisorId: null, userId: m.userId }));
        }
        return [];
      }),
    },
  };

  const notificationClient: DailyDigestNotificationClient = {
    dispatch: vi.fn(async () => ({ notificationIds: ['n-1'] })),
  };

  return { prisma, notificationClient };
}

describe('ComputeDailyDigestUseCase', () => {
  const tenantId = 'tenant-xyz';
  const date = new Date('2026-04-20T12:00:00Z');

  let prisma: DailyDigestPrisma;
  let notificationClient: DailyDigestNotificationClient;
  let useCase: ComputeDailyDigestUseCase;

  beforeEach(() => {
    vi.useRealTimers();
  });

  it('dispatcha 1 digest por admin + 1 por manager com canais corretos', async () => {
    ({ prisma, notificationClient } = makeMocks({
      pending: 5,
      approved: 3,
      missing: 2,
      adminGroups: [['admin-user-1']],
      subordinates: [{ supervisorId: 'mgr-emp-1', userId: 'sub-user-1' }],
      managerLookup: [{ id: 'mgr-emp-1', userId: 'manager-user-1' }],
    }));
    useCase = new ComputeDailyDigestUseCase(prisma, notificationClient);

    const result = await useCase.execute({ tenantId, date });

    expect(result.pendingCount).toBe(5);
    expect(result.approvedCount).toBe(3);
    expect(result.missingCount).toBe(2);
    expect(result.dispatchedCount).toBe(2);
    expect(result.adminCount).toBe(1);
    expect(result.managerCount).toBe(1);

    const dispatchMock = notificationClient.dispatch as ReturnType<
      typeof vi.fn
    >;
    expect(dispatchMock).toHaveBeenCalledTimes(2);
    const adminCall = dispatchMock.mock.calls.find(
      (args) =>
        (args[0].recipients as { userIds: string[] }).userIds[0] ===
        'admin-user-1',
    );
    const managerCall = dispatchMock.mock.calls.find(
      (args) =>
        (args[0].recipients as { userIds: string[] }).userIds[0] ===
        'manager-user-1',
    );
    expect(adminCall?.[0].channels).toEqual([
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ]);
    expect(managerCall?.[0].channels).toEqual([NotificationChannel.IN_APP]);
  });

  it('idempotencyKey é único por-tenant-date-user', async () => {
    ({ prisma, notificationClient } = makeMocks({
      adminGroups: [['user-A', 'user-B']],
    }));
    useCase = new ComputeDailyDigestUseCase(prisma, notificationClient);
    await useCase.execute({ tenantId, date });

    const dispatchMock = notificationClient.dispatch as ReturnType<
      typeof vi.fn
    >;
    const keys = dispatchMock.mock.calls.map((c) => c[0].idempotencyKey);
    expect(keys).toContain('punch.daily_digest:tenant-xyz:2026-04-20:user-A');
    expect(keys).toContain('punch.daily_digest:tenant-xyz:2026-04-20:user-B');
  });

  it('dedupe: admin que também é manager recebe só 1 digest (com canais EMAIL)', async () => {
    ({ prisma, notificationClient } = makeMocks({
      adminGroups: [['overlapping-user']],
      subordinates: [{ supervisorId: 'mgr-emp', userId: 'sub-user' }],
      managerLookup: [{ id: 'mgr-emp', userId: 'overlapping-user' }],
    }));
    useCase = new ComputeDailyDigestUseCase(prisma, notificationClient);

    const result = await useCase.execute({ tenantId, date });

    expect(result.dispatchedCount).toBe(1);
    expect(result.recipientUserIds).toEqual(['overlapping-user']);
    const dispatchMock = notificationClient.dispatch as ReturnType<
      typeof vi.fn
    >;
    expect(dispatchMock.mock.calls[0][0].channels).toEqual([
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ]);
  });

  it('at-least-once: recipient falho não bloqueia os demais', async () => {
    ({ prisma, notificationClient } = makeMocks({
      adminGroups: [['good-user', 'bad-user']],
    }));
    const dispatchMock = notificationClient.dispatch as ReturnType<
      typeof vi.fn
    >;
    dispatchMock.mockImplementationOnce(async (args) => {
      const userId = (args.recipients as { userIds: string[] }).userIds[0];
      if (userId === 'bad-user') throw new Error('smtp down');
      return { notificationIds: ['n-ok'] };
    });
    useCase = new ComputeDailyDigestUseCase(prisma, notificationClient);

    const result = await useCase.execute({ tenantId, date });

    expect(result.dispatchedCount).toBeGreaterThanOrEqual(1);
  });

  it('queries usam tenantId scope — counts não vazam cross-tenant', async () => {
    ({ prisma, notificationClient } = makeMocks({
      pending: 7,
      approved: 0,
      missing: 0,
      adminGroups: [['user-A']],
    }));
    useCase = new ComputeDailyDigestUseCase(prisma, notificationClient);
    await useCase.execute({ tenantId, date });

    const countMock = prisma.punchApproval.count as ReturnType<typeof vi.fn>;
    const calls = countMock.mock.calls as Array<
      [{ where: { tenantId?: string } }]
    >;
    for (const c of calls) {
      expect(c[0].where.tenantId).toBe(tenantId);
    }
  });
});
