import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntryType } from '@/entities/hr/value-objects';
import type { TimeEntry as PrismaTimeEntry } from '@prisma/generated/client.js';

export function mapTimeEntryPrismaToDomain(timeEntry: PrismaTimeEntry) {
  return {
    employeeId: new UniqueEntityID(timeEntry.employeeId),
    entryType: TimeEntryType.create(timeEntry.entryType),
    timestamp: timeEntry.timestamp,
    latitude: timeEntry.latitude ? Number(timeEntry.latitude) : undefined,
    longitude: timeEntry.longitude ? Number(timeEntry.longitude) : undefined,
    ipAddress: timeEntry.ipAddress ?? undefined,
    notes: timeEntry.notes ?? undefined,
    createdAt: timeEntry.createdAt,
  };
}
