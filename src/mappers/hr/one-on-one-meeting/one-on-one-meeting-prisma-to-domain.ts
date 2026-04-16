import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneStatus } from '@/entities/hr/one-on-one-meeting';
import type { OneOnOneMeeting as PrismaOneOnOneMeeting } from '@prisma/generated/client.js';

export function mapOneOnOneMeetingPrismaToDomain(
  record: PrismaOneOnOneMeeting,
) {
  return {
    tenantId: new UniqueEntityID(record.tenantId),
    managerId: new UniqueEntityID(record.managerId),
    reportId: new UniqueEntityID(record.reportId),
    scheduledAt: record.scheduledAt,
    durationMinutes: record.durationMinutes,
    status: record.status as OneOnOneStatus,
    privateNotesManager: record.privateNotesManager ?? undefined,
    privateNotesReport: record.privateNotesReport ?? undefined,
    sharedNotes: record.sharedNotes ?? undefined,
    cancelledReason: record.cancelledReason ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt ?? undefined,
  };
}
