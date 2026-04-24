import { describe, expect, it, vi } from 'vitest';

import { buildPunchExportDataset } from './build-punch-export-dataset';

type MockEntry = {
  id: string;
  employeeId: string;
  timestamp: Date;
  entryType: string;
  nsrNumber: number | null;
  deviceType: string | null;
  latitude: { toNumber: () => number } | null;
  longitude: { toNumber: () => number } | null;
  originNsrNumber: number | null;
  adjustmentType: 'ORIGINAL' | 'ADJUSTMENT_APPROVED';
  employee: {
    id: string;
    registrationNumber: string;
    fullName: string;
    department: { name: string } | null;
  };
  punchApproval: {
    status: string;
    reason: string | null;
    resolverNote: string | null;
    details: Record<string, unknown> | null;
  } | null;
};

function makeEntry(partial: Partial<MockEntry> = {}): MockEntry {
  return {
    id: `entry-${Math.random().toString(36).slice(2, 8)}`,
    employeeId: 'emp-1',
    timestamp: new Date('2026-04-15T11:02:00.000Z'),
    entryType: 'CLOCK_IN',
    nsrNumber: 1001,
    deviceType: 'MOBILE',
    latitude: null,
    longitude: null,
    originNsrNumber: null,
    adjustmentType: 'ORIGINAL',
    employee: {
      id: 'emp-1',
      registrationNumber: '00123',
      fullName: 'JOAO DA SILVA',
      department: { name: 'TI' },
    },
    punchApproval: null,
    ...partial,
  };
}

function makePrismaMock(opts: {
  entries: MockEntry[];
  tenant?: { id: string; name: string; settings: unknown } | null;
  esocialConfig?: { employerDocument: string | null } | null;
}) {
  const findManyMock = vi.fn(
    async (args: { cursor?: { id: string }; take: number }) => {
      const start = args.cursor
        ? opts.entries.findIndex((e) => e.id === args.cursor!.id) + 1
        : 0;
      return opts.entries.slice(start, start + args.take);
    },
  );

  return {
    tenant: {
      findUnique: vi.fn(async () =>
        opts.tenant === undefined
          ? { id: 'tenant-1', name: 'Empresa Demo', settings: {} }
          : opts.tenant,
      ),
    },
    esocialConfig: {
      findUnique: vi.fn(async () => opts.esocialConfig ?? null),
    },
    timeEntry: {
      findMany: findManyMock,
    },
  };
}

describe('buildPunchExportDataset', () => {
  it('retorna rows vazias quando não há TimeEntries no período', async () => {
    const prisma = makePrismaMock({ entries: [] });
    const result = await buildPunchExportDataset({
      prisma: prisma as never,
      tenantId: 'tenant-1',
      startDate: new Date('2026-04-01T00:00:00Z'),
      endDate: new Date('2026-04-30T23:59:59Z'),
    });

    expect(result.rows).toEqual([]);
    expect(result.tenant.name).toBe('Empresa Demo');
    expect(result.period.startDate).toBeInstanceOf(Date);
  });

  it('mapeia TimeEntry → PunchExportRow sem expor CPF (LGPD sentinel)', async () => {
    const entry = makeEntry({
      id: 'e1',
      nsrNumber: 4001,
      entryType: 'CLOCK_IN',
      timestamp: new Date('2026-04-15T11:02:15.000Z'),
      latitude: { toNumber: () => -23.5505 },
      longitude: { toNumber: () => -46.6333 },
    });
    const prisma = makePrismaMock({ entries: [entry] });
    const result = await buildPunchExportDataset({
      prisma: prisma as never,
      tenantId: 'tenant-1',
      startDate: new Date('2026-04-01T00:00:00Z'),
      endDate: new Date('2026-04-30T23:59:59Z'),
    });

    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];
    expect(row.nsr).toBe(4001);
    expect(row.employeeRegistration).toBe('00123');
    expect(row.employeeName).toBe('JOAO DA SILVA');
    expect(row.department).toBe('TI');
    expect(row.type).toBe('IN');
    expect(row.geoLat).toBe(-23.5505);
    expect(row.geoLng).toBe(-46.6333);
    // LGPD: row shape tem campos fixos — `cpf` não é uma das keys
    expect(Object.keys(row)).not.toContain('cpf');
  });

  it('usa cursor pagination — chama findMany quantas vezes for necessário até drenar', async () => {
    const entries: MockEntry[] = Array.from({ length: 2500 }, (_, i) =>
      makeEntry({ id: `e${i}`, nsrNumber: 5000 + i }),
    );
    const prisma = makePrismaMock({ entries });
    const result = await buildPunchExportDataset({
      prisma: prisma as never,
      tenantId: 'tenant-1',
      startDate: new Date('2026-04-01T00:00:00Z'),
      endDate: new Date('2026-04-30T23:59:59Z'),
    });

    expect(result.rows).toHaveLength(2500);
    // 1000, 1000, 500 → 3 páginas no mínimo; implementação faz 1 extra para
    // confirmar drenagem (1000, 1000, 500 — o último < chunk, break).
    expect(prisma.timeEntry.findMany).toHaveBeenCalled();
    const calls = prisma.timeEntry.findMany.mock.calls.length;
    expect(calls).toBeGreaterThanOrEqual(3);
  });

  it('filtra por employeeIds no where da query', async () => {
    const prisma = makePrismaMock({ entries: [] });
    await buildPunchExportDataset({
      prisma: prisma as never,
      tenantId: 'tenant-1',
      startDate: new Date('2026-04-01T00:00:00Z'),
      endDate: new Date('2026-04-30T23:59:59Z'),
      employeeIds: ['e-aaa', 'e-bbb'],
    });
    const firstCall = prisma.timeEntry.findMany.mock.calls[0][0] as unknown as {
      where: Record<string, unknown>;
    };
    const where = firstCall.where as { employeeId?: { in: string[] } };
    expect(where.employeeId?.in).toEqual(['e-aaa', 'e-bbb']);
  });

  it('emite status=EXCEPTION_PENDING quando PunchApproval está PENDING', async () => {
    const entry = makeEntry({
      punchApproval: {
        status: 'PENDING',
        reason: 'OUT_OF_GEOFENCE',
        resolverNote: null,
        details: { distanceMeters: 250 },
      },
    });
    const prisma = makePrismaMock({ entries: [entry] });
    const result = await buildPunchExportDataset({
      prisma: prisma as never,
      tenantId: 'tenant-1',
      startDate: new Date('2026-04-01T00:00:00Z'),
      endDate: new Date('2026-04-30T23:59:59Z'),
    });
    expect(result.rows[0].status).toBe('EXCEPTION_PENDING');
    expect(result.rows[0].geofenceDistance).toBe(250);
  });

  it('mapeia entryType CLOCK_OUT → OUT e BREAK_START → BREAK_IN', async () => {
    const entries = [
      makeEntry({ id: 'a', entryType: 'CLOCK_OUT' }),
      makeEntry({ id: 'b', entryType: 'BREAK_START' }),
      makeEntry({ id: 'c', entryType: 'OVERTIME_END' }),
    ];
    const prisma = makePrismaMock({ entries });
    const result = await buildPunchExportDataset({
      prisma: prisma as never,
      tenantId: 'tenant-1',
      startDate: new Date('2026-04-01T00:00:00Z'),
      endDate: new Date('2026-04-30T23:59:59Z'),
    });
    expect(result.rows[0].type).toBe('OUT');
    expect(result.rows[1].type).toBe('BREAK_IN');
    expect(result.rows[2].type).toBe('OVERTIME_OUT');
  });
});
