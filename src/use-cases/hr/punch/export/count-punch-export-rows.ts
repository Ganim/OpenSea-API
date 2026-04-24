/**
 * Phase 7 / Plan 07-04 — D-11 row-count helper for dispatcher threshold
 * decision (sync vs. async).
 *
 * Trivial wrapper around `prisma.timeEntry.count`. No .spec file — zero
 * branching logic. Covered by the dispatcher.spec via vi.hoisted mock.
 */

export interface CountPunchExportRowsParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  employeeIds?: string[];
  departmentIds?: string[];
}

export interface CountPunchExportRowsResult {
  estimated: number;
}

export async function countPunchExportRows(
  params: CountPunchExportRowsParams,
): Promise<CountPunchExportRowsResult> {
  const where: Record<string, unknown> = {
    tenantId: params.tenantId,
    timestamp: { gte: params.startDate, lte: params.endDate },
  };
  if (params.employeeIds?.length) {
    where.employeeId = { in: params.employeeIds };
  }
  if (params.departmentIds?.length) {
    where.employee = { departmentId: { in: params.departmentIds } };
  }

  const count: number = await params.prisma.timeEntry.count({ where });
  return { estimated: count };
}
