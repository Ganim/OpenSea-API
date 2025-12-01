import type { WorkSchedule } from '@/entities/hr/work-schedule';

export interface WorkScheduleDTO {
  id: string;
  name: string;
  description?: string | null;
  mondayStart?: string | null;
  mondayEnd?: string | null;
  tuesdayStart?: string | null;
  tuesdayEnd?: string | null;
  wednesdayStart?: string | null;
  wednesdayEnd?: string | null;
  thursdayStart?: string | null;
  thursdayEnd?: string | null;
  fridayStart?: string | null;
  fridayEnd?: string | null;
  saturdayStart?: string | null;
  saturdayEnd?: string | null;
  sundayStart?: string | null;
  sundayEnd?: string | null;
  breakDuration: number;
  isActive: boolean;
  weeklyHours: number;
  createdAt: Date;
  updatedAt: Date;
}

export function workScheduleToDTO(workSchedule: WorkSchedule): WorkScheduleDTO {
  return {
    id: workSchedule.id.toString(),
    name: workSchedule.name,
    description: workSchedule.description ?? null,
    mondayStart: workSchedule.mondayStart ?? null,
    mondayEnd: workSchedule.mondayEnd ?? null,
    tuesdayStart: workSchedule.tuesdayStart ?? null,
    tuesdayEnd: workSchedule.tuesdayEnd ?? null,
    wednesdayStart: workSchedule.wednesdayStart ?? null,
    wednesdayEnd: workSchedule.wednesdayEnd ?? null,
    thursdayStart: workSchedule.thursdayStart ?? null,
    thursdayEnd: workSchedule.thursdayEnd ?? null,
    fridayStart: workSchedule.fridayStart ?? null,
    fridayEnd: workSchedule.fridayEnd ?? null,
    saturdayStart: workSchedule.saturdayStart ?? null,
    saturdayEnd: workSchedule.saturdayEnd ?? null,
    sundayStart: workSchedule.sundayStart ?? null,
    sundayEnd: workSchedule.sundayEnd ?? null,
    breakDuration: workSchedule.breakDuration,
    isActive: workSchedule.isActive,
    weeklyHours: workSchedule.calculateWeeklyHours(),
    createdAt: workSchedule.createdAt,
    updatedAt: workSchedule.updatedAt,
  };
}
