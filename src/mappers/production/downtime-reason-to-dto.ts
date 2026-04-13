import type { ProductionDowntimeReason } from '@/entities/production/downtime-reason';

export interface DowntimeReasonDTO {
  id: string;
  code: string;
  name: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
}

export function downtimeReasonToDTO(
  entity: ProductionDowntimeReason,
): DowntimeReasonDTO {
  return {
    id: entity.downtimeReasonId.toString(),
    code: entity.code,
    name: entity.name,
    category: entity.category,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
  };
}
