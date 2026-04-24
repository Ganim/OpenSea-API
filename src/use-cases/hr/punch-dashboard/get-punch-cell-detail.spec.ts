import { beforeEach, describe, expect, it } from 'vitest';

import { GetPunchCellDetailUseCase } from './get-punch-cell-detail';

/**
 * Phase 7 / Plan 07-05b — cell detail read use case (Warning #9 fix).
 *
 * Cobre 4 cenários:
 *   1. Returns 3 timeEntries quando o employee bateu 3× no dia.
 *   2. activeApproval populado quando há approval cobrindo o dia.
 *   3. scopedEmployeeIds exclusion → throw FORBIDDEN.
 *   4. activeRequests filtered to APPROVED requests covering the date.
 */

interface FakeTimeEntry {
  id: string;
  employeeId: string;
  timestamp: Date;
  entryType: string;
}

interface FakeApproval {
  id: string;
  employeeId: string;
  status: string;
  reason: string | null;
  resolverUserId: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  timeEntry: { timestamp: Date } | null;
}

interface FakeEmployeeRequest {
  id: string;
  employeeId: string;
  type: string;
  status: string;
  data: { startDate?: string; endDate?: string };
  createdAt: Date;
}

function makeStub(state: {
  timeEntries: FakeTimeEntry[];
  approvals: FakeApproval[];
  requests: FakeEmployeeRequest[];
}) {
  return {
    timeEntry: {
      findMany: async (args: {
        where: {
          tenantId: string;
          employeeId: string;
          timestamp: { gte: Date; lte: Date };
        };
      }) => {
        return state.timeEntries.filter(
          (te) =>
            te.employeeId === args.where.employeeId &&
            te.timestamp >= args.where.timestamp.gte &&
            te.timestamp <= args.where.timestamp.lte,
        );
      },
    },
    punchApproval: {
      findFirst: async (args: {
        where: {
          tenantId: string;
          employeeId: string;
          OR: Array<{
            createdAt?: { gte: Date; lte: Date };
            timeEntry?: { timestamp: { gte: Date; lte: Date } };
          }>;
        };
      }) => {
        const matchedAll = state.approvals.filter((a) => {
          if (a.employeeId !== args.where.employeeId) return false;
          const dayStart = args.where.OR[0].createdAt!.gte;
          const dayEnd = args.where.OR[0].createdAt!.lte;
          if (a.createdAt >= dayStart && a.createdAt <= dayEnd) return true;
          if (
            a.timeEntry &&
            a.timeEntry.timestamp >= dayStart &&
            a.timeEntry.timestamp <= dayEnd
          )
            return true;
          return false;
        });
        return matchedAll[0] ?? null;
      },
    },
    employeeRequest: {
      findMany: async (args: {
        where: {
          tenantId: string;
          employeeId: string;
          status: string;
        };
      }) => {
        return state.requests.filter(
          (r) =>
            r.employeeId === args.where.employeeId &&
            r.status === args.where.status,
        );
      },
    },
  };
}

describe('GetPunchCellDetailUseCase', () => {
  let tenantId: string;
  let employeeId: string;

  beforeEach(() => {
    tenantId = 'tenant-1';
    employeeId = 'emp-1';
  });

  it('returns all 3 time entries when employee batched 3× on that day', async () => {
    const day = new Date('2026-04-20T00:00:00.000Z');
    const stub = makeStub({
      timeEntries: [
        {
          id: 'te-1',
          employeeId,
          timestamp: new Date('2026-04-20T08:00:00.000Z'),
          entryType: 'CLOCK_IN',
        },
        {
          id: 'te-2',
          employeeId,
          timestamp: new Date('2026-04-20T12:00:00.000Z'),
          entryType: 'BREAK_START',
        },
        {
          id: 'te-3',
          employeeId,
          timestamp: new Date('2026-04-20T17:30:00.000Z'),
          entryType: 'CLOCK_OUT',
        },
      ],
      approvals: [],
      requests: [],
    });
    const useCase = new GetPunchCellDetailUseCase(stub as never);
    const result = await useCase.execute({ tenantId, employeeId, date: day });

    expect(result.timeEntries).toHaveLength(3);
    expect(result.timeEntries[0].id).toBe('te-1');
    expect(result.timeEntries[2].type).toBe('CLOCK_OUT');
    expect(result.activeApproval).toBeNull();
    expect(result.activeRequests).toHaveLength(0);
  });

  it('populates activeApproval when an approval covers the day', async () => {
    const day = new Date('2026-04-20T00:00:00.000Z');
    const approval: FakeApproval = {
      id: 'app-1',
      employeeId,
      status: 'PENDING',
      reason: 'OUT_OF_GEOFENCE',
      resolverUserId: null,
      resolvedAt: null,
      createdAt: new Date('2026-04-20T10:00:00.000Z'),
      timeEntry: null,
    };
    const stub = makeStub({
      timeEntries: [],
      approvals: [approval],
      requests: [],
    });
    const useCase = new GetPunchCellDetailUseCase(stub as never);
    const result = await useCase.execute({ tenantId, employeeId, date: day });

    expect(result.activeApproval).not.toBeNull();
    expect(result.activeApproval?.id).toBe('app-1');
    expect(result.activeApproval?.status).toBe('PENDING');
  });

  it('throws FORBIDDEN when scopedEmployeeIds excludes target employee', async () => {
    const day = new Date('2026-04-20T00:00:00.000Z');
    const stub = makeStub({
      timeEntries: [],
      approvals: [],
      requests: [],
    });
    const useCase = new GetPunchCellDetailUseCase(stub as never);

    await expect(
      useCase.execute({
        tenantId,
        employeeId,
        date: day,
        scopedEmployeeIds: ['emp-other'],
      }),
    ).rejects.toThrow(/FORBIDDEN/);
  });

  it('returns active APPROVED requests covering the date', async () => {
    const day = new Date('2026-04-20T00:00:00.000Z');
    const reqApproved: FakeEmployeeRequest = {
      id: 'req-1',
      employeeId,
      type: 'VACATION',
      status: 'APPROVED',
      data: { startDate: '2026-04-15', endDate: '2026-04-25' },
      createdAt: new Date('2026-04-10T00:00:00.000Z'),
    };
    const reqPending: FakeEmployeeRequest = {
      id: 'req-2',
      employeeId,
      type: 'VACATION',
      status: 'PENDING',
      data: { startDate: '2026-04-15', endDate: '2026-04-25' },
      createdAt: new Date('2026-04-10T00:00:00.000Z'),
    };
    const stub = makeStub({
      timeEntries: [],
      approvals: [],
      requests: [reqApproved, reqPending],
    });
    const useCase = new GetPunchCellDetailUseCase(stub as never);
    const result = await useCase.execute({ tenantId, employeeId, date: day });

    expect(result.activeRequests).toHaveLength(1);
    expect(result.activeRequests[0].id).toBe('req-1');
    expect(result.activeRequests[0].status).toBe('APPROVED');
  });
});
