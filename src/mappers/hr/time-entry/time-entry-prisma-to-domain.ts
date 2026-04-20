import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntryType } from '@/entities/hr/value-objects';
import type { TimeEntry as PrismaTimeEntry } from '@prisma/generated/client.js';

export function mapTimeEntryPrismaToDomain(timeEntry: PrismaTimeEntry) {
  return {
    tenantId: new UniqueEntityID(timeEntry.tenantId),
    employeeId: new UniqueEntityID(timeEntry.employeeId),
    entryType: TimeEntryType.create(timeEntry.entryType),
    timestamp: timeEntry.timestamp,
    latitude: timeEntry.latitude ? Number(timeEntry.latitude) : undefined,
    longitude: timeEntry.longitude ? Number(timeEntry.longitude) : undefined,
    ipAddress: timeEntry.ipAddress ?? undefined,
    notes: timeEntry.notes ?? undefined,
    // Phase 5 (Plan 05-07 / D-04): JSONB payload. Prisma returns it typed
    // as `JsonValue | null`; we widen to our domain's opaque `Record<string, unknown>`
    // (the wider type carries no invariants, so the widening is safe).
    metadata:
      (timeEntry.metadata as Record<string, unknown> | null | undefined) ??
      null,
    createdAt: timeEntry.createdAt,
  };
}

/**
 * Phase 06 / Plan 06-02 mapper extension — projects the columns added by
 * 06-01 (`nsrNumber`, `originNsrNumber`, `adjustmentType`) onto a flat shape
 * the AFD/AFDT use cases consume directly. Kept separate from the domain
 * mapper to avoid expanding the `TimeEntry` entity (these columns are
 * Portaria infrastructure, not business behaviour the entity needs to enforce).
 *
 * Returns a plain object — the AFD builder needs only the data points listed
 * here, not full `TimeEntry` semantics.
 */
export function mapTimeEntryPrismaToCompliance(
  timeEntry: PrismaTimeEntry & {
    nsrNumber?: number | null;
    originNsrNumber?: number | null;
    adjustmentType?: string | null;
  },
): {
  id: string;
  tenantId: string;
  employeeId: string;
  entryType: string;
  timestamp: Date;
  nsrNumber: number;
  originNsrNumber: number | null;
  adjustmentType: 'ORIGINAL' | 'ADJUSTMENT_APPROVED';
} {
  return {
    id: timeEntry.id,
    tenantId: timeEntry.tenantId,
    employeeId: timeEntry.employeeId,
    entryType: timeEntry.entryType,
    timestamp: timeEntry.timestamp,
    nsrNumber: timeEntry.nsrNumber ?? 0,
    originNsrNumber: timeEntry.originNsrNumber ?? null,
    adjustmentType:
      (timeEntry.adjustmentType as 'ORIGINAL' | 'ADJUSTMENT_APPROVED' | null) ??
      'ORIGINAL',
  };
}
