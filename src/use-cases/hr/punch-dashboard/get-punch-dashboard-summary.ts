/**
 * GetPunchDashboardSummaryUseCase — Phase 07 / Plan 07-05b (Wave 3).
 *
 * Pure read-side use case que materializa contadores agregados para o
 * card-grid superior do dashboard do gestor. 5 COUNT queries em paralelo:
 *   - pendingApprovals: PunchApproval com status PENDING.
 *   - approvedToday: PunchApproval com status APPROVED + resolvedAt >= hoje 00:00 UTC.
 *   - missingToday: PunchMissedLog com date == hoje 00:00 UTC e resolvedAt null.
 *   - devicesOnline / devicesOffline: PunchDevice por status (com deletedAt/revokedAt null).
 *
 * Scope hierárquico (D-07): controller passa `scopedEmployeeIds` opcional;
 * quando definido, filtra os 3 contadores employee-scoped (approvals + missing).
 * Devices NÃO são scoped por employee — visibilidade tenant-wide para todos
 * os usuários com permissão de dashboard.
 */

const APPROVAL_STATUSES = {
  PENDING: 'PENDING' as const,
  APPROVED: 'APPROVED' as const,
};

const DEVICE_STATUS_ONLINE = 'ONLINE' as const;
const DEVICE_STATUS_OFFLINE = 'OFFLINE' as const;

export interface DashboardSummaryPrisma {
  punchApproval: {
    count(args: {
      where: {
        tenantId: string;
        status?: string;
        resolvedAt?: { gte: Date };
        employeeId?: { in: string[] };
      };
    }): Promise<number>;
  };
  punchMissedLog: {
    count(args: {
      where: {
        tenantId: string;
        date?: Date;
        resolvedAt?: null;
        employeeId?: { in: string[] };
      };
    }): Promise<number>;
  };
  punchDevice: {
    count(args: {
      where: {
        tenantId: string;
        status?: string;
        deletedAt?: null;
        revokedAt?: null;
      };
    }): Promise<number>;
  };
}

export interface GetPunchDashboardSummaryInput {
  tenantId: string;
  scopedEmployeeIds?: string[];
  /** Override "today" start-of-day UTC — used by tests for determinism. */
  now?: Date;
}

export interface PunchDashboardSummaryResponse {
  pendingApprovals: number;
  approvedToday: number;
  missingToday: number;
  devicesOnline: number;
  devicesOffline: number;
}

function startOfDayUTC(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

export class GetPunchDashboardSummaryUseCase {
  constructor(private prisma: DashboardSummaryPrisma) {}

  async execute(
    input: GetPunchDashboardSummaryInput,
  ): Promise<PunchDashboardSummaryResponse> {
    const { tenantId, scopedEmployeeIds, now } = input;
    const todayStart = startOfDayUTC(now ?? new Date());
    const employeeFilter =
      scopedEmployeeIds && scopedEmployeeIds.length > 0
        ? { employeeId: { in: scopedEmployeeIds } }
        : {};

    const [
      pending,
      approvedToday,
      missingToday,
      devicesOnline,
      devicesOffline,
    ] = await Promise.all([
      this.prisma.punchApproval.count({
        where: {
          tenantId,
          status: APPROVAL_STATUSES.PENDING,
          ...employeeFilter,
        },
      }),
      this.prisma.punchApproval.count({
        where: {
          tenantId,
          status: APPROVAL_STATUSES.APPROVED,
          resolvedAt: { gte: todayStart },
          ...employeeFilter,
        },
      }),
      this.prisma.punchMissedLog.count({
        where: {
          tenantId,
          date: todayStart,
          resolvedAt: null,
          ...employeeFilter,
        },
      }),
      this.prisma.punchDevice.count({
        where: {
          tenantId,
          status: DEVICE_STATUS_ONLINE,
          deletedAt: null,
          revokedAt: null,
        },
      }),
      this.prisma.punchDevice.count({
        where: {
          tenantId,
          status: DEVICE_STATUS_OFFLINE,
          deletedAt: null,
          revokedAt: null,
        },
      }),
    ]);

    return {
      pendingApprovals: pending,
      approvedToday,
      missingToday,
      devicesOnline,
      devicesOffline,
    };
  }
}
