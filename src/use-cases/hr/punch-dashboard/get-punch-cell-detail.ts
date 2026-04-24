/**
 * GetPunchCellDetailUseCase — Phase 07 / Plan 07-05b (Wave 3, Warning #9 fix).
 *
 * Endpoint detalhe-de-célula que substitui 3 round-trips do frontend (timeEntries
 * + activeApproval + activeRequests) por uma única query.
 *
 * Trust boundary (T-7-05b-04): se `scopedEmployeeIds` for fornecido pelo
 * controller (gestor não-admin), o use case bloqueia consulta a employee fora
 * do conjunto delegado — throws Error('FORBIDDEN: employee out of scope').
 *
 * Os specs cobrem 4 cenários: 3 entries, activeApproval populado, scope
 * exclusion, requests filtered to APPROVED covering date. EmployeeRequest
 * `data` JSON carrega `{ startDate, endDate }` (não há colunas dedicadas no
 * schema — confirmado em prisma/schema.prisma:15292).
 */

export interface CellDetailTimeEntry {
  id: string;
  occurredAt: string;
  type: string;
}

export interface CellDetailActiveApproval {
  id: string;
  status: string;
  reason: string | null;
  resolverUserId: string | null;
  resolvedAt: string | null;
}

export interface CellDetailActiveRequest {
  id: string;
  type: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export interface PunchCellDetailResponse {
  timeEntries: CellDetailTimeEntry[];
  activeApproval: CellDetailActiveApproval | null;
  activeRequests: CellDetailActiveRequest[];
}

export interface CellDetailPrisma {
  timeEntry: {
    findMany(args: {
      where: {
        tenantId: string;
        employeeId: string;
        timestamp: { gte: Date; lte: Date };
      };
      orderBy?: { timestamp: 'asc' | 'desc' };
      select?: Record<string, unknown>;
    }): Promise<
      Array<{
        id: string;
        timestamp: Date;
        entryType: string;
      }>
    >;
  };
  punchApproval: {
    findFirst(args: {
      where: {
        tenantId: string;
        employeeId: string;
        OR: Array<{
          createdAt?: { gte: Date; lte: Date };
          timeEntry?: { timestamp: { gte: Date; lte: Date } };
        }>;
      };
      orderBy?: { createdAt: 'asc' | 'desc' };
      select?: Record<string, unknown>;
    }): Promise<{
      id: string;
      status: string;
      reason: string | null;
      resolverUserId: string | null;
      resolvedAt: Date | null;
    } | null>;
  };
  employeeRequest: {
    findMany(args: {
      where: {
        tenantId: string;
        employeeId: string;
        status: string;
      };
    }): Promise<
      Array<{
        id: string;
        type: string;
        status: string;
        data: unknown;
      }>
    >;
  };
}

export interface GetPunchCellDetailInput {
  tenantId: string;
  employeeId: string;
  date: Date;
  scopedEmployeeIds?: string[];
}

function startOfDayUTC(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function endOfDayUTC(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

/**
 * Verifica se uma EmployeeRequest cobre a data (data.startDate <= date <= data.endDate).
 * `data` é Json — se start/end não forem strings YYYY-MM-DD válidas, request é incluída
 * por segurança (tratamos como cobertura ampla — gestor decide).
 */
function requestCoversDate(
  data: unknown,
  date: Date,
): { covers: boolean; startDate: string | null; endDate: string | null } {
  if (typeof data !== 'object' || data == null) {
    return { covers: true, startDate: null, endDate: null };
  }
  const obj = data as Record<string, unknown>;
  const startStr =
    typeof obj.startDate === 'string' ? (obj.startDate as string) : null;
  const endStr =
    typeof obj.endDate === 'string' ? (obj.endDate as string) : null;
  if (!startStr || !endStr) {
    return { covers: true, startDate: startStr, endDate: endStr };
  }
  const start = new Date(`${startStr}T00:00:00.000Z`);
  const end = new Date(`${endStr}T23:59:59.999Z`);
  return {
    covers:
      start.getTime() <= date.getTime() && end.getTime() >= date.getTime(),
    startDate: startStr,
    endDate: endStr,
  };
}

export class GetPunchCellDetailUseCase {
  constructor(private prisma: CellDetailPrisma) {}

  async execute(
    input: GetPunchCellDetailInput,
  ): Promise<PunchCellDetailResponse> {
    if (
      input.scopedEmployeeIds &&
      !input.scopedEmployeeIds.includes(input.employeeId)
    ) {
      throw new Error('FORBIDDEN: employee out of scope');
    }

    const dayStart = startOfDayUTC(input.date);
    const dayEnd = endOfDayUTC(input.date);

    const [timeEntries, activeApproval, allApprovedRequests] =
      await Promise.all([
        this.prisma.timeEntry.findMany({
          where: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            timestamp: { gte: dayStart, lte: dayEnd },
          },
          orderBy: { timestamp: 'asc' },
          select: { id: true, timestamp: true, entryType: true },
        }),
        this.prisma.punchApproval.findFirst({
          where: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            OR: [
              { createdAt: { gte: dayStart, lte: dayEnd } },
              { timeEntry: { timestamp: { gte: dayStart, lte: dayEnd } } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            reason: true,
            resolverUserId: true,
            resolvedAt: true,
          },
        }),
        this.prisma.employeeRequest.findMany({
          where: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            status: 'APPROVED',
          },
        }),
      ]);

    const activeRequests: CellDetailActiveRequest[] = allApprovedRequests
      .map((r) => {
        const cov = requestCoversDate(r.data, input.date);
        return {
          covers: cov.covers,
          dto: {
            id: r.id,
            type: r.type,
            status: r.status,
            startDate: cov.startDate,
            endDate: cov.endDate,
          },
        };
      })
      .filter((wrap) => wrap.covers)
      .map((wrap) => wrap.dto);

    return {
      timeEntries: timeEntries.map((te) => ({
        id: te.id,
        occurredAt: te.timestamp.toISOString(),
        type: te.entryType,
      })),
      activeApproval: activeApproval
        ? {
            id: activeApproval.id,
            status: activeApproval.status,
            reason: activeApproval.reason,
            resolverUserId: activeApproval.resolverUserId,
            resolvedAt: activeApproval.resolvedAt?.toISOString() ?? null,
          }
        : null,
      activeRequests,
    };
  }
}
