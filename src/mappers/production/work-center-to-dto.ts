import type { ProductionWorkCenter } from '@/entities/production/work-center';

export interface WorkCenterDTO {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function workCenterToDTO(entity: ProductionWorkCenter): WorkCenterDTO {
  return {
    id: entity.workCenterId.toString(),
    code: entity.code,
    name: entity.name,
    description: entity.description,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
