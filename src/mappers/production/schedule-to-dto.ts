import type { ProductionSchedule } from '@/entities/production/schedule';

export interface ProductionScheduleDTO {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function scheduleToDTO(
  entity: ProductionSchedule,
): ProductionScheduleDTO {
  return {
    id: entity.scheduleId.toString(),
    name: entity.name,
    description: entity.description,
    startDate: entity.startDate,
    endDate: entity.endDate,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
