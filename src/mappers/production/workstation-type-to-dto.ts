import type { ProductionWorkstationType } from '@/entities/production/workstation-type';

export interface WorkstationTypeDTO {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function workstationTypeToDTO(
  entity: ProductionWorkstationType,
): WorkstationTypeDTO {
  return {
    id: entity.workstationTypeId.toString(),
    name: entity.name,
    description: entity.description,
    icon: entity.icon,
    color: entity.color,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
