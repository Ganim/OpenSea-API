import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AbsenceStatus, AbsenceType } from '@/entities/hr/value-objects';
import type { Absence as PrismaAbsence } from '@prisma/generated/client.js';

export function mapAbsencePrismaToDomain(absence: PrismaAbsence) {
  return {
    employeeId: new UniqueEntityID(absence.employeeId),
    type: AbsenceType.create(absence.type),
    status: AbsenceStatus.create(absence.status),
    startDate: absence.startDate,
    endDate: absence.endDate,
    totalDays: absence.totalDays,
    reason: absence.reason ?? undefined,
    documentUrl: absence.documentUrl ?? undefined,
    cid: absence.cid ?? undefined,
    isPaid: absence.isPaid,
    isInssResponsibility: absence.isInssResponsibility ?? false,
    vacationPeriodId: absence.vacationPeriodId
      ? new UniqueEntityID(absence.vacationPeriodId)
      : undefined,
    requestedBy: absence.requestedBy
      ? new UniqueEntityID(absence.requestedBy)
      : undefined,
    approvedBy: absence.approvedBy
      ? new UniqueEntityID(absence.approvedBy)
      : undefined,
    approvedAt: absence.approvedAt ?? undefined,
    rejectionReason: absence.rejectionReason ?? undefined,
    notes: absence.notes ?? undefined,
    createdAt: absence.createdAt,
    updatedAt: absence.updatedAt,
  };
}
