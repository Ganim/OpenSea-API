/**
 * Phase 9 / Plan 09-02 — ListAuditUseCase implementation.
 * Queries TimeEntry + PunchApproval with composite scoring.
 * Score based on signals: FACE_MATCH_FAIL_3X=25, GPS_INCONSISTENT=20,
 * OUT_OF_GEOFENCE=15, suspectMock=20, drift>120=30, drift 30-119=10, fingerprint=10.
 */

import type {
  EmployeesRepository,
  PunchApprovalsRepository,
  TimeEntriesRepository,
} from '@/repositories/hr';
import { prisma } from '@/lib/prisma';
import type { ListAuditUseCase } from './list-audit';

interface Signal {
  kind: string;
  value: unknown;
  severity: 'low' | 'medium' | 'high';
}

interface AuditItem {
  id: string;
  type: 'TimeEntry' | 'PunchApproval';
  employeeId: string;
  employeeName: string;
  matricula?: string | null;
  timestamp: Date;
  entryType?: string;
  origin?: string;
  signals: Signal[];
  score: number;
}

export class ListAuditUseCaseImpl implements ListAuditUseCase {
  constructor(
    private timeEntriesRepo: TimeEntriesRepository,
    private punchApprovalsRepo: PunchApprovalsRepository,
    private employeesRepo: EmployeesRepository,
  ) {}

  async execute(req: Parameters<ListAuditUseCase['execute']>[0]) {
    const limit = Math.min(req.limit ?? 20, 100);
    const cursor = req.cursor
      ? Buffer.from(req.cursor, 'base64').toString('utf-8')
      : null;

    // Build WHERE clause for TimeEntry + PunchApproval composite query
    const whereFilter = this.buildFilterWhere(req.filters, req.matchMode);

    // Fetch TimeEntry rows with pagination
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        tenantId: req.tenantId,
        ...whereFilter,
        ...(cursor && { id: { gt: cursor } }),
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            matricula: true,
          },
        },
      },
      orderBy: { id: 'asc' },
      take: limit + 1, // fetch one extra to detect nextCursor
    });

    // Fetch PunchApproval rows with same pagination
    const punchApprovals = await prisma.punchApproval.findMany({
      where: {
        tenantId: req.tenantId,
        // Note: PunchApproval has different signal structure; filter by reason/details
        ...(req.filters?.gps?.outOfGeofence && {
          reason: { contains: 'OUT_OF_GEOFENCE' },
        }),
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            matricula: true,
          },
        },
      },
      orderBy: { id: 'asc' },
      take: limit + 1,
    });

    // Merge and score both lists
    const items = this.mergeAndScore(timeEntries, punchApprovals);

    // Sort by score DESC, then by ID
    items.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.id.localeCompare(b.id);
    });

    // Paginate
    const hasMore = items.length > limit;
    const paginatedItems = items.slice(0, limit);
    const nextCursor = hasMore
      ? Buffer.from(paginatedItems[paginatedItems.length - 1].id).toString(
          'base64',
        )
      : undefined;

    return {
      items: paginatedItems,
      meta: {
        total: items.length,
        nextCursor,
      },
    };
  }

  private buildFilterWhere(
    filters: Parameters<ListAuditUseCase['execute']>[0]['filters'],
    matchMode?: 'or' | 'and',
  ): Record<string, unknown> {
    const conditions: Record<string, unknown>[] = [];

    if (!filters) return {};

    // Face match filters
    if (filters.faceMatch) {
      if (filters.faceMatch.includeLow) {
        conditions.push({
          metadata: {
            path: ['faceMatchOutcome'],
            equals: 'low',
          },
        });
      }
      if (filters.faceMatch.includeFail3x) {
        // Metadata contains approval reason FACE_MATCH_FAIL_3X
        conditions.push({
          metadata: {
            path: ['approvalReason'],
            string_contains: 'FACE_MATCH_FAIL_3X',
          },
        });
      }
    }

    // GPS filters
    if (filters.gps) {
      if (filters.gps.outOfGeofence) {
        conditions.push({
          metadata: {
            path: ['outOfGeofence'],
            equals: true,
          },
        });
      }
      if (filters.gps.gpsInconsistent) {
        conditions.push({
          metadata: {
            path: ['gpsInconsistent'],
            equals: true,
          },
        });
      }
      if (filters.gps.accuracyAbove100) {
        conditions.push({
          metadata: {
            path: ['accuracy'],
            gt: 100,
          },
        });
      }
      if (filters.gps.velocityAnomaly) {
        conditions.push({
          metadata: {
            path: ['velocityKmh'],
            gt: 200,
          },
        });
      }
      if (filters.gps.suspectMock) {
        conditions.push({
          metadata: {
            path: ['suspectMock'],
            equals: true,
          },
        });
      }
    }

    // Clock drift filters
    if (filters.drift?.minDriftSec) {
      conditions.push({
        metadata: {
          path: ['clockDriftSec'],
          gte: filters.drift.minDriftSec,
        },
      });
    }

    // Date range filter
    if (filters.dateRange) {
      conditions.push({
        timestamp: {
          gte: filters.dateRange.from,
          lte: filters.dateRange.to,
        },
      });
    }

    if (conditions.length === 0) return {};

    return matchMode === 'or' ? { OR: conditions } : { AND: conditions };
  }

  private mergeAndScore(
    timeEntries: Awaited<ReturnType<typeof prisma.timeEntry.findMany>>,
    punchApprovals: Awaited<ReturnType<typeof prisma.punchApproval.findMany>>,
  ): AuditItem[] {
    const items: AuditItem[] = [];

    // Score each TimeEntry
    for (const entry of timeEntries) {
      const score = this.calculateScore(entry);
      items.push({
        id: entry.id,
        type: 'TimeEntry',
        employeeId: entry.employeeId,
        employeeName: entry.employee.name,
        matricula: entry.employee.matricula,
        timestamp: entry.timestamp,
        entryType: entry.entryType,
        origin:
          ((entry.metadata as Record<string, unknown> | null)?.origin as
            | string
            | undefined) || 'KIOSK',
        signals: this.extractSignals(entry),
        score,
      });
    }

    // Score each PunchApproval
    for (const approval of punchApprovals) {
      const score = this.calculateApprovalScore(approval);
      items.push({
        id: approval.id,
        type: 'PunchApproval',
        employeeId: approval.employeeId,
        employeeName: approval.employee.name,
        matricula: approval.employee.matricula,
        timestamp: approval.createdAt,
        entryType: approval.reason || undefined,
        origin: 'APPROVAL',
        signals: this.extractApprovalSignals(approval),
        score,
      });
    }

    return items;
  }

  private calculateScore(
    entry: Awaited<ReturnType<typeof prisma.timeEntry.findFirst>>,
  ): number {
    let score = 0;
    const meta = (entry?.metadata as Record<string, unknown> | null) || {};

    // FACE_MATCH_FAIL_3X = 25
    if (meta.approvalReason === 'FACE_MATCH_FAIL_3X') score += 25;

    // GPS_INCONSISTENT = 20
    if (meta.gpsInconsistent) score += 20;

    // OUT_OF_GEOFENCE = 15
    if (meta.outOfGeofence) score += 15;

    // suspectMock = 20
    if (meta.suspectMock) score += 20;

    // Clock drift: >120s = 30, 30-119s = 10
    const driftSec = (meta.clockDriftSec as number | undefined) ?? 0;
    if (driftSec > 120) score += 30;
    else if (driftSec >= 30) score += 10;

    // Fingerprint divergence = 10 (placeholder)
    if (meta.fingerprintHash) score += 10;

    return Math.min(score, 100);
  }

  private calculateApprovalScore(
    approval: Awaited<ReturnType<typeof prisma.punchApproval.findFirst>>,
  ): number {
    let score = 0;

    // GPS_INCONSISTENT in reason = 20
    if (approval?.reason?.includes('GPS_INCONSISTENT')) score += 20;

    // OUT_OF_GEOFENCE in reason = 15
    if (approval?.reason?.includes('OUT_OF_GEOFENCE')) score += 15;

    // FACE_MATCH_FAIL_3X in reason = 25
    if (approval?.reason?.includes('FACE_MATCH_FAIL_3X')) score += 25;

    return Math.min(score, 100);
  }

  private extractSignals(
    entry: Awaited<ReturnType<typeof prisma.timeEntry.findFirst>>,
  ): Signal[] {
    const signals: Signal[] = [];
    const meta = (entry?.metadata as Record<string, unknown> | null) || {};

    if (meta.approvalReason === 'FACE_MATCH_FAIL_3X') {
      signals.push({
        kind: 'FACE_MATCH_FAIL_3X',
        value: meta.approvalDetails,
        severity: 'high',
      });
    }

    if (meta.gpsInconsistent) {
      signals.push({
        kind: 'GPS_INCONSISTENT',
        value: {
          accuracy: meta.accuracy,
          velocity: meta.velocityKmh,
        },
        severity: 'high',
      });
    }

    if (meta.outOfGeofence) {
      signals.push({
        kind: 'OUT_OF_GEOFENCE',
        value: { distance: meta.geofenceDistance },
        severity: 'medium',
      });
    }

    if (meta.suspectMock) {
      signals.push({
        kind: 'SUSPECT_MOCK',
        value: true,
        severity: 'medium',
      });
    }

    const driftSec = (meta.clockDriftSec as number | undefined) ?? 0;
    if (driftSec > 120) {
      signals.push({
        kind: 'CLOCK_DRIFT_CRITICAL',
        value: driftSec,
        severity: 'high',
      });
    } else if (driftSec >= 30) {
      signals.push({
        kind: 'CLOCK_DRIFT_WARNING',
        value: driftSec,
        severity: 'medium',
      });
    }

    if (meta.fingerprintHash) {
      signals.push({
        kind: 'FINGERPRINT_DIVERGENCE',
        value: meta.fingerprintHash,
        severity: 'low',
      });
    }

    return signals;
  }

  private extractApprovalSignals(
    approval: Awaited<ReturnType<typeof prisma.punchApproval.findFirst>>,
  ): Signal[] {
    const signals: Signal[] = [];

    if (approval?.reason) {
      signals.push({
        kind: 'APPROVAL_REASON',
        value: approval.reason,
        severity: 'medium',
      });
    }

    if (approval?.details) {
      const details = approval.details as Record<string, unknown>;
      if (details.gpsInconsistent) {
        signals.push({
          kind: 'GPS_INCONSISTENT',
          value: details,
          severity: 'high',
        });
      }
    }

    return signals;
  }
}
