/**
 * Phase 9 / Plan 09-02 — GetAuditDetailUseCase implementation.
 * Loads TimeEntry or PunchApproval detail with all signals extracted.
 */

import type {
  PunchApprovalsRepository,
  TimeEntriesRepository,
} from '@/repositories/hr';
import { prisma } from '@/lib/prisma';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { GetAuditDetailUseCase } from './get-audit-detail';

type TimeEntryWithEmployee = Awaited<
  ReturnType<typeof prisma.timeEntry.findFirst>
>;
type PunchApprovalWithEmployee = Awaited<
  ReturnType<typeof prisma.punchApproval.findFirst>
>;

interface Signal {
  kind: string;
  value: unknown;
  severity: 'low' | 'medium' | 'high';
}

export class GetAuditDetailUseCaseImpl implements GetAuditDetailUseCase {
  constructor(
    private timeEntriesRepo: TimeEntriesRepository,
    private punchApprovalsRepo: PunchApprovalsRepository,
  ) {}

  async execute(req: Parameters<GetAuditDetailUseCase['execute']>[0]) {
    const { tenantId, rowId } = req;

    // Try to find as TimeEntry first
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: rowId,
        tenantId,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            matricula: true,
            CPF: true,
          },
        },
      },
    });

    if (timeEntry) {
      // Load previous time entry for comparison
      const prevEntry = await prisma.timeEntry.findFirst({
        where: {
          tenantId,
          employeeId: timeEntry.employeeId,
          timestamp: { lt: timeEntry.timestamp },
        },
        orderBy: { timestamp: 'desc' },
        include: {
          employee: {
            select: { id: true, name: true },
          },
        },
      });

      return {
        row: {
          id: timeEntry.id,
          type: 'TimeEntry' as const,
          employeeId: timeEntry.employeeId,
          employeeName: timeEntry.employee.name,
          matricula: timeEntry.employee.matricula,
          cpf: timeEntry.employee.CPF,
          timestamp: timeEntry.timestamp,
          entryType: timeEntry.entryType,
          latitude: timeEntry.latitude,
          longitude: timeEntry.longitude,
          ipAddress: timeEntry.ipAddress,
          notes: timeEntry.notes,
          metadata: timeEntry.metadata,
        },
        allSignals: this.extractTimeEntrySignals(timeEntry),
        prevEntry: prevEntry
          ? {
              id: prevEntry.id,
              timestamp: prevEntry.timestamp,
              entryType: prevEntry.entryType,
              latitude: prevEntry.latitude,
              longitude: prevEntry.longitude,
            }
          : null,
      };
    }

    // Try as PunchApproval
    const punchApproval = await prisma.punchApproval.findFirst({
      where: {
        id: rowId,
        tenantId,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            matricula: true,
            CPF: true,
          },
        },
      },
    });

    if (punchApproval) {
      return {
        row: {
          id: punchApproval.id,
          type: 'PunchApproval' as const,
          employeeId: punchApproval.employeeId,
          employeeName: punchApproval.employee.name,
          matricula: punchApproval.employee.matricula,
          cpf: punchApproval.employee.CPF,
          timestamp: punchApproval.createdAt,
          reason: punchApproval.reason,
          details: punchApproval.details,
          resolvedAt: punchApproval.resolvedAt,
          resolverAction: punchApproval.resolverAction,
        },
        allSignals: this.extractApprovalSignals(punchApproval),
        prevEntry: null,
      };
    }

    throw new ResourceNotFoundError('Audit row not found');
  }

  private extractTimeEntrySignals(entry: TimeEntryWithEmployee): Signal[] {
    const signals: Signal[] = [];
    const meta = (entry?.metadata as Record<string, unknown> | null) || {};

    // All possible signals from metadata
    const signalMap: Array<{
      field: string;
      kind: string;
      severity: 'low' | 'medium' | 'high';
    }> = [
      {
        field: 'approvalReason',
        kind: 'APPROVAL_REASON',
        severity: 'high',
      },
      {
        field: 'gpsInconsistent',
        kind: 'GPS_INCONSISTENT',
        severity: 'high',
      },
      {
        field: 'outOfGeofence',
        kind: 'OUT_OF_GEOFENCE',
        severity: 'medium',
      },
      {
        field: 'suspectMock',
        kind: 'SUSPECT_MOCK',
        severity: 'medium',
      },
      {
        field: 'faceMatchOutcome',
        kind: 'FACE_MATCH_OUTCOME',
        severity: 'low',
      },
      {
        field: 'clockDriftSec',
        kind: 'CLOCK_DRIFT',
        severity: 'medium',
      },
      {
        field: 'accuracy',
        kind: 'GPS_ACCURACY',
        severity: 'low',
      },
      {
        field: 'velocityKmh',
        kind: 'GPS_VELOCITY',
        severity: 'medium',
      },
      {
        field: 'ipGeo',
        kind: 'IP_GEOLOCATION',
        severity: 'low',
      },
      {
        field: 'fingerprintHash',
        kind: 'FINGERPRINT_HASH',
        severity: 'low',
      },
    ];

    for (const signal of signalMap) {
      if (signal.field in meta) {
        signals.push({
          kind: signal.kind,
          value: meta[signal.field],
          severity: signal.severity,
        });
      }
    }

    return signals;
  }

  private extractApprovalSignals(
    approval: PunchApprovalWithEmployee,
  ): Signal[] {
    const signals: Signal[] = [];

    if (approval?.reason) {
      signals.push({
        kind: 'APPROVAL_REASON',
        value: approval.reason,
        severity: 'high',
      });
    }

    if (approval?.details) {
      const details = approval.details as Record<string, unknown>;
      for (const [key, value] of Object.entries(details)) {
        signals.push({
          kind: key.toUpperCase(),
          value,
          severity: 'medium',
        });
      }
    }

    if (approval?.resolverAction) {
      signals.push({
        kind: 'RESOLVER_ACTION',
        value: approval.resolverAction,
        severity: 'high',
      });
    }

    return signals;
  }
}
