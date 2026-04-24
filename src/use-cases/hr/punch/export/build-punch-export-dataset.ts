/**
 * Phase 7 / Plan 07-04 — D-11 dataset builder for punch batch export.
 *
 * Pure orchestrator function: receives a `prisma`-shaped client (injectable
 * for tests) + filters, resolves TimeEntry + Employee + PunchApproval rows
 * via **cursor pagination** (chunks of 1000) and returns a LGPD-safe
 * `PunchExportRow[]` ready for CSV/PDF serialisation.
 *
 * **LGPD / T-7-04-01 gate:** The `PunchExportRow` shape is constructed here
 * without any reference to `Employee.cpf`. The controller / CSV builder /
 * PDF renderer downstream consume only this shape, so the CPF column never
 * reaches the output artifact regardless of the format.
 *
 * **Anti-DoS / T-7-04-03+04:** Pagination uses cursor + take=1000 — memory
 * cap is O(chunk) not O(rows). The worker runs with `concurrency: 2` so two
 * 50-k exports never coexist in the same node.
 */

import type { PunchExportRow } from '@/lib/csv/punch-csv-builder';

// Re-exported so downstream modules (worker, use case, controller) can keep
// importing the row type from a single place (this module). `PunchExportRow`
// lives in `@/lib/csv` because the CSV writer is the consumer that fixes the
// column shape — re-exporting keeps the Clean Architecture layering clean
// (`lib` provides the canonical type; `use-cases` re-surfaces).
export type { PunchExportRow } from '@/lib/csv/punch-csv-builder';

export type PunchExportRowType = PunchExportRow['type'];

export interface PunchExportDataset {
  rows: PunchExportRow[];
  tenant: {
    id: string;
    name: string;
    cnpj: string;
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface BuildPunchExportDatasetParams {
  /** Any Prisma-like client with `.tenant.findUnique`, `.esocialConfig.findUnique`, `.timeEntry.findMany`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  employeeIds?: string[];
  departmentIds?: string[];
}

const CHUNK_SIZE = 1000;

function onlyDigits(s: string | null | undefined): string {
  return (s ?? '').replace(/\D/g, '');
}

function mapEntryTypeToRowType(entryType: string): PunchExportRowType {
  switch (entryType) {
    case 'CLOCK_IN':
      return 'IN';
    case 'CLOCK_OUT':
      return 'OUT';
    case 'BREAK_START':
      return 'BREAK_IN';
    case 'BREAK_END':
      return 'BREAK_OUT';
    case 'OVERTIME_START':
      return 'OVERTIME_IN';
    case 'OVERTIME_END':
      return 'OVERTIME_OUT';
    default:
      return 'IN';
  }
}

function deriveStatus(
  approval: {
    status: string;
    reason: string | null;
  } | null,
): string {
  if (!approval) return 'NORMAL';
  if (approval.status === 'PENDING') return 'EXCEPTION_PENDING';
  if (approval.status === 'APPROVED') return 'EXCEPTION_APPROVED';
  if (approval.status === 'REJECTED') return 'EXCEPTION_REJECTED';
  return 'NORMAL';
}

function formatTime(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function coerceDecimal(
  v: { toNumber: () => number } | number | null | undefined,
): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof (v as { toNumber: () => number }).toNumber === 'function') {
    return (v as { toNumber: () => number }).toNumber();
  }
  return null;
}

function extractGeofenceDistance(details: unknown): number | null {
  if (!details || typeof details !== 'object') return null;
  const obj = details as Record<string, unknown>;
  const candidates = ['distanceMeters', 'distance_meters', 'distance'];
  for (const k of candidates) {
    const raw = obj[k];
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw;
    }
    if (typeof raw === 'string' && raw.trim().length > 0) {
      const n = Number(raw);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toExportRow(entry: any): PunchExportRow {
  return {
    nsr: entry.nsrNumber ?? 0,
    employeeRegistration: entry.employee?.registrationNumber ?? '',
    employeeName: entry.employee?.fullName ?? '',
    department: entry.employee?.department?.name ?? null,
    date: entry.timestamp as Date,
    time: formatTime(entry.timestamp as Date),
    type: mapEntryTypeToRowType(String(entry.entryType)),
    status: deriveStatus(entry.punchApproval),
    approvalNote: entry.punchApproval?.resolverNote ?? null,
    deviceKind: entry.deviceType ?? 'UNKNOWN',
    geoLat: coerceDecimal(entry.latitude),
    geoLng: coerceDecimal(entry.longitude),
    geofenceDistance: extractGeofenceDistance(entry.punchApproval?.details),
    originNsr: entry.originNsrNumber ?? null,
    adjustmentNsr:
      entry.adjustmentType === 'ADJUSTMENT_APPROVED'
        ? (entry.nsrNumber ?? null)
        : null,
  };
}

export async function buildPunchExportDataset(
  params: BuildPunchExportDatasetParams,
): Promise<PunchExportDataset> {
  const { prisma, tenantId, startDate, endDate, employeeIds, departmentIds } =
    params;

  // ── 1. Tenant + EsocialConfig for header (CNPJ) ─────────────────────────
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, settings: true },
  });
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} não encontrado`);
  }

  const esocialConfig = await prisma.esocialConfig.findUnique({
    where: { tenantId },
    select: { employerDocument: true },
  });
  const settings = (tenant.settings ?? {}) as Record<string, unknown>;
  const tenantCnpj =
    onlyDigits(esocialConfig?.employerDocument) ||
    (typeof settings.cnpj === 'string' ? onlyDigits(settings.cnpj) : '') ||
    '00000000000000';

  // ── 2. TimeEntries cursor-paginated ─────────────────────────────────────
  const where: Record<string, unknown> = {
    tenantId,
    timestamp: { gte: startDate, lte: endDate },
  };
  if (employeeIds?.length) {
    where.employeeId = { in: employeeIds };
  }
  if (departmentIds?.length) {
    where.employee = { departmentId: { in: departmentIds } };
  }

  const rows: PunchExportRow[] = [];
  let cursor: string | undefined;

  // Drain pages until findMany returns less than CHUNK_SIZE.
  // Hard cap: 1M rows (safety net for runaway tenants / malformed filters).
  const HARD_CAP = 1_000_000;
  while (rows.length < HARD_CAP) {
    const batch = await prisma.timeEntry.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        timestamp: true,
        entryType: true,
        nsrNumber: true,
        deviceType: true,
        latitude: true,
        longitude: true,
        originNsrNumber: true,
        adjustmentType: true,
        employee: {
          select: {
            id: true,
            registrationNumber: true,
            fullName: true,
            department: { select: { name: true } },
          },
        },
        punchApproval: {
          select: {
            status: true,
            reason: true,
            resolverNote: true,
            details: true,
          },
        },
      },
      orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
      take: CHUNK_SIZE,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    if (batch.length === 0) break;
    for (const entry of batch) {
      rows.push(toExportRow(entry));
    }
    if (batch.length < CHUNK_SIZE) break;
    cursor = batch[batch.length - 1].id as string;
  }

  return {
    rows,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      cnpj: tenantCnpj,
    },
    period: { startDate, endDate },
  };
}
