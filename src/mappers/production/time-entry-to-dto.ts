import type { ProductionTimeEntry } from '@/entities/production/time-entry';

export interface TimeEntryDTO {
  id: string;
  jobCardId: string;
  operatorId: string;
  startTime: Date;
  endTime: Date | null;
  breakMinutes: number;
  entryType: string;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: Date;
}

export function timeEntryToDTO(entity: ProductionTimeEntry): TimeEntryDTO {
  return {
    id: entity.timeEntryId.toString(),
    jobCardId: entity.jobCardId.toString(),
    operatorId: entity.operatorId.toString(),
    startTime: entity.startTime,
    endTime: entity.endTime,
    breakMinutes: entity.breakMinutes,
    entryType: entity.entryType,
    durationMinutes: entity.durationMinutes,
    notes: entity.notes,
    createdAt: entity.createdAt,
  };
}
