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
