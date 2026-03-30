import type { OKRCheckIn } from '@/entities/hr/okr-check-in';

export interface OKRCheckInDTO {
  id: string;
  keyResultId: string;
  employeeId: string;
  previousValue: number;
  newValue: number;
  note: string | null;
  confidence: string;
  createdAt: string;
}

export function okrCheckInToDTO(checkIn: OKRCheckIn): OKRCheckInDTO {
  return {
    id: checkIn.id.toString(),
    keyResultId: checkIn.keyResultId.toString(),
    employeeId: checkIn.employeeId.toString(),
    previousValue: checkIn.previousValue,
    newValue: checkIn.newValue,
    note: checkIn.note ?? null,
    confidence: checkIn.confidence,
    createdAt: checkIn.createdAt.toISOString(),
  };
}
