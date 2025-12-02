import type { VacationPeriod } from '@/entities/hr/vacation-period';

export interface VacationPeriodDTO {
  id: string;
  employeeId: string;
  acquisitionStart: Date;
  acquisitionEnd: Date;
  concessionStart: Date;
  concessionEnd: Date;
  totalDays: number;
  usedDays: number;
  soldDays: number;
  remainingDays: number;
  status: string;
  scheduledStart?: Date | null;
  scheduledEnd?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function vacationPeriodToDTO(
  vacationPeriod: VacationPeriod,
): VacationPeriodDTO {
  return {
    id: vacationPeriod.id.toString(),
    employeeId: vacationPeriod.employeeId.toString(),
    acquisitionStart: vacationPeriod.acquisitionStart,
    acquisitionEnd: vacationPeriod.acquisitionEnd,
    concessionStart: vacationPeriod.concessionStart,
    concessionEnd: vacationPeriod.concessionEnd,
    totalDays: vacationPeriod.totalDays,
    usedDays: vacationPeriod.usedDays,
    soldDays: vacationPeriod.soldDays,
    remainingDays: vacationPeriod.remainingDays,
    status: vacationPeriod.status.value,
    scheduledStart: vacationPeriod.scheduledStart ?? null,
    scheduledEnd: vacationPeriod.scheduledEnd ?? null,
    notes: vacationPeriod.notes ?? null,
    createdAt: vacationPeriod.createdAt,
    updatedAt: vacationPeriod.updatedAt,
  };
}
