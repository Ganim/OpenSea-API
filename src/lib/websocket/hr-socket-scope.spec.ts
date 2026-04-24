import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks (Plan 04-05 pattern — vi.mock usa factory closure;
// sem vi.hoisted a closure captura undefined no tempo do mock).
const mocks = vi.hoisted(() => ({
  getUserPermissionCodes: vi.fn<(userId: unknown) => Promise<string[]>>(),
  employeeFindFirst: vi.fn(),
  employeeFindMany: vi.fn(),
  approvalDelegationFindMany: vi.fn(),
  permissionGroupFindMany: vi.fn(),
}));

vi.mock('@/services/rbac/get-permission-service', () => ({
  getPermissionService: () => ({
    getUserPermissionCodes: mocks.getUserPermissionCodes,
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      findFirst: mocks.employeeFindFirst,
      findMany: mocks.employeeFindMany,
    },
    approvalDelegation: {
      findMany: mocks.approvalDelegationFindMany,
    },
    permissionGroup: {
      findMany: mocks.permissionGroupFindMany,
    },
  },
}));

// Avoid eager @env initialization that the real logger pulls in.
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  emitToEligibleManagers,
  joinHrRoomsForUser,
  resolveEligibleManagerUserIds,
} from './hr-socket-scope';

describe('joinHrRoomsForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins tenant:T1:hr when user has any hr.* permission', async () => {
    mocks.getUserPermissionCodes.mockResolvedValue(['hr.time-control.access']);
    const socket = { join: vi.fn() };
    await joinHrRoomsForUser(socket as never, 'U1', 'T1');
    expect(socket.join).toHaveBeenCalledWith('tenant:T1:hr');
    expect(socket.join).not.toHaveBeenCalledWith('tenant:T1:hr:admin');
  });

  it('also joins tenant:T1:hr:admin when user has hr.punch-approvals.admin', async () => {
    mocks.getUserPermissionCodes.mockResolvedValue([
      'hr.punch-approvals.admin',
    ]);
    const socket = { join: vi.fn() };
    await joinHrRoomsForUser(socket as never, 'U1', 'T1');
    expect(socket.join).toHaveBeenCalledWith('tenant:T1:hr');
    expect(socket.join).toHaveBeenCalledWith('tenant:T1:hr:admin');
  });

  it('does not join any :hr room when user has no hr.* permission', async () => {
    mocks.getUserPermissionCodes.mockResolvedValue(['finance.entries.access']);
    const socket = { join: vi.fn() };
    await joinHrRoomsForUser(socket as never, 'U1', 'T1');
    expect(socket.join).not.toHaveBeenCalledWith('tenant:T1:hr');
    expect(socket.join).not.toHaveBeenCalledWith('tenant:T1:hr:admin');
  });

  it('swallows errors from permission service (does not throw)', async () => {
    mocks.getUserPermissionCodes.mockRejectedValue(new Error('RBAC down'));
    const socket = { join: vi.fn() };
    await expect(
      joinHrRoomsForUser(socket as never, 'U1', 'T1'),
    ).resolves.not.toThrow();
    expect(socket.join).not.toHaveBeenCalled();
  });
});

describe('resolveEligibleManagerUserIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns direct supervisor userId + delegation userIds + admin HR userIds', async () => {
    mocks.employeeFindFirst.mockImplementation(async ({ where }: never) => {
      const w = where as { id: string };
      if (w.id === 'E1')
        return { id: 'E1', supervisorId: 'E-MGR', userId: 'U-EMP' };
      if (w.id === 'E-MGR')
        return { id: 'E-MGR', userId: 'U-MGR-DIRECT', supervisorId: null };
      return null;
    });
    mocks.employeeFindMany.mockImplementation(async ({ where }: never) => {
      const w = where as { id?: { in?: string[] } };
      if (w.id?.in?.includes('E-DEL'))
        return [{ id: 'E-DEL', userId: 'U-MGR-DEL' }];
      return [];
    });
    mocks.approvalDelegationFindMany.mockResolvedValue([
      { delegateId: 'E-DEL' },
    ]);
    mocks.permissionGroupFindMany.mockResolvedValue([
      { users: [{ userId: 'U-ADMIN1' }] },
    ]);

    const result = await resolveEligibleManagerUserIds('T1', 'E1');
    expect(new Set(result)).toEqual(
      new Set(['U-MGR-DIRECT', 'U-MGR-DEL', 'U-ADMIN1']),
    );
  });

  it('returns empty array when employee has no supervisor and no admin exists', async () => {
    mocks.employeeFindFirst.mockResolvedValue({
      id: 'E1',
      supervisorId: null,
      userId: 'U-EMP',
    });
    mocks.employeeFindMany.mockResolvedValue([]);
    mocks.approvalDelegationFindMany.mockResolvedValue([]);
    mocks.permissionGroupFindMany.mockResolvedValue([]);

    const result = await resolveEligibleManagerUserIds('T1', 'E1');
    expect(result).toEqual([]);
  });

  it('BFS recursive: level-2 supervisor (CEO → Manager → Analyst) both included', async () => {
    mocks.employeeFindFirst.mockImplementation(async ({ where }: never) => {
      const w = where as { id: string };
      if (w.id === 'E-ANALYST')
        return {
          id: 'E-ANALYST',
          supervisorId: 'E-MGR',
          userId: 'U-ANALYST',
        };
      if (w.id === 'E-MGR')
        return { id: 'E-MGR', userId: 'U-MGR', supervisorId: 'E-CEO' };
      if (w.id === 'E-CEO')
        return { id: 'E-CEO', userId: 'U-CEO', supervisorId: null };
      return null;
    });
    mocks.employeeFindMany.mockResolvedValue([]);
    mocks.approvalDelegationFindMany.mockResolvedValue([]);
    mocks.permissionGroupFindMany.mockResolvedValue([]);

    const result = await resolveEligibleManagerUserIds('T1', 'E-ANALYST');
    expect(new Set(result)).toEqual(new Set(['U-MGR', 'U-CEO']));
  });

  it('active ApprovalDelegation: delegate inherits subordinate visibility', async () => {
    mocks.employeeFindFirst.mockImplementation(async ({ where }: never) => {
      const w = where as { id: string };
      if (w.id === 'E-ANALYST')
        return {
          id: 'E-ANALYST',
          supervisorId: 'E-MGR',
          userId: 'U-ANALYST',
        };
      if (w.id === 'E-MGR')
        return { id: 'E-MGR', userId: 'U-MGR', supervisorId: null };
      return null;
    });
    mocks.employeeFindMany.mockImplementation(async ({ where }: never) => {
      const w = where as { id?: { in?: string[] } };
      if (w.id?.in?.includes('E-DEL'))
        return [{ id: 'E-DEL', userId: 'U-DEL' }];
      return [];
    });
    mocks.approvalDelegationFindMany.mockImplementation(
      async ({ where }: never) => {
        const w = where as { delegatorId: string };
        if (w.delegatorId === 'E-MGR') return [{ delegateId: 'E-DEL' }];
        return [];
      },
    );
    mocks.permissionGroupFindMany.mockResolvedValue([]);

    const result = await resolveEligibleManagerUserIds('T1', 'E-ANALYST');
    expect(new Set(result)).toEqual(new Set(['U-MGR', 'U-DEL']));
  });

  it('expired ApprovalDelegation: delegate NOT in eligible set (repo filter excludes)', async () => {
    mocks.employeeFindFirst.mockImplementation(async ({ where }: never) => {
      const w = where as { id: string };
      if (w.id === 'E-ANALYST')
        return {
          id: 'E-ANALYST',
          supervisorId: 'E-MGR',
          userId: 'U-ANALYST',
        };
      if (w.id === 'E-MGR')
        return { id: 'E-MGR', userId: 'U-MGR', supervisorId: null };
      return null;
    });
    mocks.employeeFindMany.mockResolvedValue([]);
    // Prisma filter (isActive + endDate >= now) excludes expired rows → empty list.
    mocks.approvalDelegationFindMany.mockResolvedValue([]);
    mocks.permissionGroupFindMany.mockResolvedValue([]);

    const result = await resolveEligibleManagerUserIds('T1', 'E-ANALYST');
    expect(new Set(result)).toEqual(new Set(['U-MGR']));
  });
});

describe('emitToEligibleManagers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits to user:{id} for each eligible manager userId', async () => {
    mocks.employeeFindFirst.mockImplementation(async ({ where }: never) => {
      const w = where as { id: string };
      if (w.id === 'E1')
        return { id: 'E1', supervisorId: 'E-MGR', userId: 'U-EMP' };
      if (w.id === 'E-MGR')
        return { id: 'E-MGR', userId: 'U-MGR', supervisorId: null };
      return null;
    });
    mocks.employeeFindMany.mockResolvedValue([]);
    mocks.approvalDelegationFindMany.mockResolvedValue([]);
    mocks.permissionGroupFindMany.mockResolvedValue([
      { users: [{ userId: 'U-ADMIN' }] },
    ]);

    const emit = vi.fn();
    const to = vi.fn().mockReturnValue({ emit });
    const io = { to };
    await emitToEligibleManagers(
      io as never,
      'T1',
      'E1',
      'punch.time-entry.scoped',
      { hello: 'world' },
    );
    expect(to).toHaveBeenCalledWith('user:U-MGR');
    expect(to).toHaveBeenCalledWith('user:U-ADMIN');
    expect(emit).toHaveBeenCalledWith('punch.time-entry.scoped', {
      hello: 'world',
    });
  });
});
