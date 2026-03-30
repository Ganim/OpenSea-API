import type { Shift } from '@/entities/hr/shift';

export interface ShiftDTO {
  id: string;
  name: string;
  code: string | null;
  type: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isNightShift: boolean;
  color: string | null;
  isActive: boolean;
  durationHours: number;
  createdAt: Date;
  updatedAt: Date;
}

export function shiftToDTO(shift: Shift): ShiftDTO {
  return {
    id: shift.id.toString(),
    name: shift.name,
    code: shift.code ?? null,
    type: shift.type,
    startTime: shift.startTime,
    endTime: shift.endTime,
    breakMinutes: shift.breakMinutes,
    isNightShift: shift.isNightShift,
    color: shift.color ?? null,
    isActive: shift.isActive,
    durationHours: shift.calculateDurationHours(),
    createdAt: shift.createdAt,
    updatedAt: shift.updatedAt,
  };
}
