import type { ProductionScheduleEntry } from '@/entities/production/schedule-entry';

export interface ProductionScheduleEntryDTO {
  id: string;
  scheduleId: string;
  productionOrderId: string | null;
  workstationId: string | null;
  title: string;
  startDate: Date;
  endDate: Date;
  status: string;
  color: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function scheduleEntryToDTO(
  entity: ProductionScheduleEntry,
): ProductionScheduleEntryDTO {
  return {
    id: entity.entryId.toString(),
    scheduleId: entity.scheduleId.toString(),
    productionOrderId: entity.productionOrderId?.toString() ?? null,
    workstationId: entity.workstationId?.toString() ?? null,
    title: entity.title,
    startDate: entity.startDate,
    endDate: entity.endDate,
    status: entity.status,
    color: entity.color,
    notes: entity.notes,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
