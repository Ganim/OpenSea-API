import type { ProductionDowntimeRecord } from '@/entities/production/downtime-record';

export interface DowntimeRecordDTO {
  id: string;
  workstationId: string;
  downtimeReasonId: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  reportedById: string;
  notes: string | null;
  createdAt: Date;
}

export function downtimeRecordToDTO(
  entity: ProductionDowntimeRecord,
): DowntimeRecordDTO {
  return {
    id: entity.downtimeRecordId.toString(),
    workstationId: entity.workstationId.toString(),
    downtimeReasonId: entity.downtimeReasonId.toString(),
    startTime: entity.startTime,
    endTime: entity.endTime,
    durationMinutes: entity.durationMinutes,
    reportedById: entity.reportedById.toString(),
    notes: entity.notes,
    createdAt: entity.createdAt,
  };
}
