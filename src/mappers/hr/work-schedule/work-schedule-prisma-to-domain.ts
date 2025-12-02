import type { WorkSchedule as PrismaWorkSchedule } from '@prisma/client';

export function mapWorkSchedulePrismaToDomain(
  workSchedule: PrismaWorkSchedule,
) {
  return {
    name: workSchedule.name,
    description: workSchedule.description ?? undefined,
    mondayStart: workSchedule.mondayStart ?? undefined,
    mondayEnd: workSchedule.mondayEnd ?? undefined,
    tuesdayStart: workSchedule.tuesdayStart ?? undefined,
    tuesdayEnd: workSchedule.tuesdayEnd ?? undefined,
    wednesdayStart: workSchedule.wednesdayStart ?? undefined,
    wednesdayEnd: workSchedule.wednesdayEnd ?? undefined,
    thursdayStart: workSchedule.thursdayStart ?? undefined,
    thursdayEnd: workSchedule.thursdayEnd ?? undefined,
    fridayStart: workSchedule.fridayStart ?? undefined,
    fridayEnd: workSchedule.fridayEnd ?? undefined,
    saturdayStart: workSchedule.saturdayStart ?? undefined,
    saturdayEnd: workSchedule.saturdayEnd ?? undefined,
    sundayStart: workSchedule.sundayStart ?? undefined,
    sundayEnd: workSchedule.sundayEnd ?? undefined,
    breakDuration: workSchedule.breakDuration,
    isActive: workSchedule.isActive,
    createdAt: workSchedule.createdAt,
    updatedAt: workSchedule.updatedAt,
  };
}
