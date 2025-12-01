import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Overtime as PrismaOvertime } from '@prisma/client';

export function mapOvertimePrismaToDomain(overtime: PrismaOvertime) {
  return {
    employeeId: new UniqueEntityID(overtime.employeeId),
    date: overtime.date,
    hours: Number(overtime.hours),
    reason: overtime.reason,
    approved: overtime.approved,
    approvedBy: overtime.approvedBy
      ? new UniqueEntityID(overtime.approvedBy)
      : undefined,
    approvedAt: overtime.approvedAt ?? undefined,
    createdAt: overtime.createdAt,
    updatedAt: overtime.updatedAt,
  };
}
