import { beforeEach, describe, expect, it } from 'vitest';

import { GetPunchHeatmapUseCase } from './get-punch-heatmap';

/**
 * Phase 7 / Plan 07-05b — heatmap read-side use case.
 *
 * Pure use case com shape mínimo Prisma (HeatmapPrisma) — 5 findMany.
 * Specs cobrem prioridade dos 6 statuses (NORMAL, ATRASO, FALTA, EXCEÇÃO,
 * JUSTIFICADO, HORA_EXTRA) + scopedEmployeeIds filter + WEEKEND/HOLIDAY
 * column flags.
 *
 * Ordem de precedência (status primário): JUSTIFICADO > EXCEÇÃO > FALTA >
 * ATRASO > NORMAL. HORA_EXTRA é secondary (stack com primary).
 */

interface FakeEmployee {
  id: string;
  fullName: string;
  socialName: string | null;
  registrationNumber: string;
  departmentId: string | null;
  department: { name: string } | null;
}

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
  createdAt: Date;
  timeEntry: { timestamp: Date } | null;
}

interface FakeVacation {
  id: string;
  employeeId: string;
  status: string;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
}

interface FakeShiftAssignment {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  shift: { startTime: string; endTime: string };
}

function makePrismaStub(state: {
  employees: FakeEmployee[];
  timeEntries: FakeTimeEntry[];
  approvals: FakeApproval[];
  vacations: FakeVacation[];
  shifts: FakeShiftAssignment[];
}) {
  return {
    employee: {
      findMany: async (args: {
        where: { tenantId: string; id?: { in: string[] } };
      }) => {
        return state.employees.filter((e) => {
          if (args.where.id?.in) return args.where.id.in.includes(e.id);
          return true;
        });
      },
    },
    timeEntry: {
      findMany: async (args: {
        where: {
          tenantId: string;
          employeeId: { in: string[] };
          timestamp: { gte: Date; lte: Date };
        };
      }) => {
        return state.timeEntries.filter(
          (te) =>
            args.where.employeeId.in.includes(te.employeeId) &&
            te.timestamp >= args.where.timestamp.gte &&
            te.timestamp <= args.where.timestamp.lte,
        );
      },
    },
    punchApproval: {
      findMany: async (args: {
        where: {
          tenantId: string;
          employeeId: { in: string[] };
          status: { in: string[] };
        };
      }) => {
        return state.approvals.filter(
          (a) =>
            args.where.employeeId.in.includes(a.employeeId) &&
            args.where.status.in.includes(a.status),
        );
      },
    },
    vacationPeriod: {
      findMany: async (args: {
        where: {
          tenantId: string;
          employeeId: { in: string[] };
          status: { in: string[] };
        };
      }) => {
        return state.vacations.filter(
          (v) =>
            args.where.employeeId.in.includes(v.employeeId) &&
            args.where.status.in.includes(v.status),
        );
      },
    },
    shiftAssignment: {
      findMany: async (args: {
        where: {
          tenantId: string;
          employeeId: { in: string[] };
          isActive: boolean;
        };
      }) => {
        return state.shifts.filter(
          (s) =>
            args.where.employeeId.in.includes(s.employeeId) &&
            s.isActive === args.where.isActive,
        );
      },
    },
  };
}

describe('GetPunchHeatmapUseCase', () => {
  let tenantId: string;
  let employee1: FakeEmployee;
  let employee2: FakeEmployee;
  let employee3: FakeEmployee;

  beforeEach(() => {
    tenantId = 'tenant-1';
    employee1 = {
      id: 'emp-1',
      fullName: 'Alice Souza',
      socialName: null,
      registrationNumber: 'EMP-001',
      departmentId: 'dep-1',
      department: { name: 'TI' },
    };
    employee2 = {
      id: 'emp-2',
      fullName: 'Bruno Lima',
      socialName: 'Bru',
      registrationNumber: 'EMP-002',
      departmentId: null,
      department: null,
    };
    employee3 = {
      id: 'emp-3',
      fullName: 'Carla Mota',
      socialName: null,
      registrationNumber: 'EMP-003',
      departmentId: 'dep-1',
      department: { name: 'TI' },
    };
  });

  it('returns rows × columns × cells for a full month with 3 employees', async () => {
    const prisma = makePrismaStub({
      employees: [employee1, employee2, employee3],
      timeEntries: [],
      approvals: [],
      vacations: [],
      shifts: [],
    });
    const useCase = new GetPunchHeatmapUseCase(prisma as never);

    const result = await useCase.execute({ tenantId, month: '2026-01' });

    expect(result.rows).toHaveLength(3);
    expect(result.columns).toHaveLength(31); // January has 31 days
    expect(result.cells).toHaveLength(3 * 31);
    expect(result.rows[0]).toMatchObject({
      id: 'emp-1',
      label: 'Alice Souza',
    });
  });

  it('marks weekends in column flags', async () => {
    const prisma = makePrismaStub({
      employees: [employee1],
      timeEntries: [],
      approvals: [],
      vacations: [],
      shifts: [],
    });
    const useCase = new GetPunchHeatmapUseCase(prisma as never);

    const result = await useCase.execute({ tenantId, month: '2026-01' });

    // 2026-01-03 = Saturday, 2026-01-04 = Sunday
    const sat = result.columns.find((c) => c.id === '2026-01-03');
    const sun = result.columns.find((c) => c.id === '2026-01-04');
    const mon = result.columns.find((c) => c.id === '2026-01-05');
    expect(sat?.isWeekend).toBe(true);
    expect(sun?.isWeekend).toBe(true);
    expect(mon?.isWeekend).toBeFalsy();
  });

  it('returns NORMAL when employee bateu dentro do shift sem atraso', async () => {
    const prisma = makePrismaStub({
      employees: [employee1],
      timeEntries: [
        {
          id: 'te-1',
          employeeId: 'emp-1',
          timestamp: new Date('2026-01-05T08:00:00.000Z'),
          entryType: 'CLOCK_IN',
        },
      ],
      approvals: [],
      vacations: [],
      shifts: [
        {
          id: 'sa-1',
          employeeId: 'emp-1',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: null,
          isActive: true,
          shift: { startTime: '08:00', endTime: '17:00' },
        },
      ],
    });
    const useCase = new GetPunchHeatmapUseCase(prisma as never);

    const result = await useCase.execute({ tenantId, month: '2026-01' });

    const cell = result.cells.find(
      (c) => c.rowId === 'emp-1' && c.colId === '2026-01-05',
    );
    expect(cell?.statuses[0]).toBe('NORMAL');
  });

  it('returns ATRASO quando primeira batida > shift start + tolerance', async () => {
    const prisma = makePrismaStub({
      employees: [employee1],
      timeEntries: [
        {
          id: 'te-late',
          employeeId: 'emp-1',
          // Shift starts 08:00; primeira batida 08:30 com tolerance 10 → ATRASO
          timestamp: new Date('2026-01-05T08:30:00.000Z'),
          entryType: 'CLOCK_IN',
        },
      ],
      approvals: [],
      vacations: [],
      shifts: [
        {
          id: 'sa-1',
          employeeId: 'emp-1',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: null,
          isActive: true,
          shift: { startTime: '08:00', endTime: '17:00' },
        },
      ],
    });
    const useCase = new GetPunchHeatmapUseCase(prisma as never);

    const result = await useCase.execute({ tenantId, month: '2026-01' });

    const cell = result.cells.find(
      (c) => c.rowId === 'emp-1' && c.colId === '2026-01-05',
    );
    expect(cell?.statuses[0]).toBe('ATRASO');
  });

  it('returns FALTA quando employee tem shift mas zero batidas e zero férias/abono', async () => {
    const prisma = makePrismaStub({
      employees: [employee1],
      timeEntries: [],
      approvals: [],
      vacations: [],
      shifts: [
        {
          id: 'sa-1',
          employeeId: 'emp-1',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: null,
          isActive: true,
          shift: { startTime: '08:00', endTime: '17:00' },
        },
      ],
    });
    const useCase = new GetPunchHeatmapUseCase(prisma as never);

    const result = await useCase.execute({ tenantId, month: '2026-01' });

    const cell = result.cells.find(
      (c) => c.rowId === 'emp-1' && c.colId === '2026-01-05', // Monday
    );
    expect(cell?.statuses[0]).toBe('FALTA');
  });

  it('EXCEÇÃO sobrepõe FALTA quando há PunchApproval PENDING no dia', async () => {
    const prisma = makePrismaStub({
      employees: [employee1],
      timeEntries: [],
      approvals: [
        {
          id: 'app-1',
          employeeId: 'emp-1',
          status: 'PENDING',
          createdAt: new Date('2026-01-05T09:00:00.000Z'),
          timeEntry: null,
        },
      ],
      vacations: [],
      shifts: [
        {
          id: 'sa-1',
          employeeId: 'emp-1',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: null,
          isActive: true,
          shift: { startTime: '08:00', endTime: '17:00' },
        },
      ],
    });
    const useCase = new GetPunchHeatmapUseCase(prisma as never);

    const result = await useCase.execute({ tenantId, month: '2026-01' });

    const cell = result.cells.find(
      (c) => c.rowId === 'emp-1' && c.colId === '2026-01-05',
    );
    expect(cell?.statuses[0]).toBe('EXCEÇÃO');
    expect(cell?.payload?.approvalId).toBe('app-1');
  });

  it('JUSTIFICADO sobrepõe FALTA quando há vacation period IN_PROGRESS cobrindo a data', async () => {
    const prisma = makePrismaStub({
      employees: [employee1],
      timeEntries: [],
      approvals: [],
      vacations: [
        {
          id: 'vp-1',
          employeeId: 'emp-1',
          status: 'IN_PROGRESS',
          scheduledStart: new Date('2026-01-01T00:00:00.000Z'),
          scheduledEnd: new Date('2026-01-15T00:00:00.000Z'),
        },
      ],
      shifts: [
        {
          id: 'sa-1',
          employeeId: 'emp-1',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: null,
          isActive: true,
          shift: { startTime: '08:00', endTime: '17:00' },
        },
      ],
    });
    const useCase = new GetPunchHeatmapUseCase(prisma as never);

    const result = await useCase.execute({ tenantId, month: '2026-01' });

    const cell = result.cells.find(
      (c) => c.rowId === 'emp-1' && c.colId === '2026-01-05',
    );
    expect(cell?.statuses[0]).toBe('JUSTIFICADO');
  });

  it('HORA_EXTRA é secondary status stackado com NORMAL quando há batida fora do shift window', async () => {
    const prisma = makePrismaStub({
      employees: [employee1],
      timeEntries: [
        {
          id: 'te-in',
          employeeId: 'emp-1',
          timestamp: new Date('2026-01-05T08:00:00.000Z'),
          entryType: 'CLOCK_IN',
        },
        {
          id: 'te-out-after-hours',
          employeeId: 'emp-1',
          // Shift ends 17:00; batida 19:00 = hora extra
          timestamp: new Date('2026-01-05T19:00:00.000Z'),
          entryType: 'CLOCK_OUT',
        },
      ],
      approvals: [],
      vacations: [],
      shifts: [
        {
          id: 'sa-1',
          employeeId: 'emp-1',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: null,
          isActive: true,
          shift: { startTime: '08:00', endTime: '17:00' },
        },
      ],
    });
    const useCase = new GetPunchHeatmapUseCase(prisma as never);

    const result = await useCase.execute({ tenantId, month: '2026-01' });

    const cell = result.cells.find(
      (c) => c.rowId === 'emp-1' && c.colId === '2026-01-05',
    );
    expect(cell?.statuses[0]).toBe('NORMAL');
    expect(cell?.statuses).toContain('HORA_EXTRA');
  });

  it('respeita employeeIds filter (scope hierárquico)', async () => {
    const prisma = makePrismaStub({
      employees: [employee1, employee2, employee3],
      timeEntries: [],
      approvals: [],
      vacations: [],
      shifts: [],
    });
    const useCase = new GetPunchHeatmapUseCase(prisma as never);

    const result = await useCase.execute({
      tenantId,
      month: '2026-01',
      employeeIds: [employee1.id, employee3.id],
    });

    expect(result.rows).toHaveLength(2);
    const rowIds = result.rows.map((r) => r.id);
    expect(rowIds).toContain('emp-1');
    expect(rowIds).toContain('emp-3');
    expect(rowIds).not.toContain('emp-2');
  });
});
