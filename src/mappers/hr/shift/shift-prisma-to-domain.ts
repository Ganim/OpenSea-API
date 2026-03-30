import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ShiftType } from '@/entities/hr/shift';
import type { Shift as PrismaShift } from '@prisma/generated/client.js';

export function mapShiftPrismaToDomain(shift: PrismaShift) {
  return {
    tenantId: new UniqueEntityID(shift.tenantId),
    name: shift.name,
    code: shift.code ?? undefined,
    type: shift.type as ShiftType,
    startTime: shift.startTime,
    endTime: shift.endTime,
    breakMinutes: shift.breakMinutes,
    isNightShift: shift.isNightShift,
    color: shift.color ?? undefined,
    isActive: shift.isActive,
    deletedAt: shift.deletedAt ?? undefined,
    createdAt: shift.createdAt,
    updatedAt: shift.updatedAt,
  };
}
