import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationStatus } from '@/entities/hr/value-objects';
import type { VacationPeriod as PrismaVacationPeriod } from '@prisma/client';

export function mapVacationPeriodPrismaToDomain(
  vacationPeriod: PrismaVacationPeriod,
) {
  return {
    employeeId: new UniqueEntityID(vacationPeriod.employeeId),
    acquisitionStart: vacationPeriod.acquisitionStart,
    acquisitionEnd: vacationPeriod.acquisitionEnd,
    concessionStart: vacationPeriod.concessionStart,
    concessionEnd: vacationPeriod.concessionEnd,
    totalDays: vacationPeriod.totalDays,
    usedDays: vacationPeriod.usedDays,
    soldDays: vacationPeriod.soldDays,
    remainingDays: vacationPeriod.remainingDays,
    status: VacationStatus.create(vacationPeriod.status),
    scheduledStart: vacationPeriod.scheduledStart ?? undefined,
    scheduledEnd: vacationPeriod.scheduledEnd ?? undefined,
    notes: vacationPeriod.notes ?? undefined,
    createdAt: vacationPeriod.createdAt,
    updatedAt: vacationPeriod.updatedAt,
  };
}
