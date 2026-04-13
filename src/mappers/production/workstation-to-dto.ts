import type { ProductionWorkstation } from '@/entities/production/workstation';

export interface WorkstationDTO {
  id: string;
  workstationTypeId: string;
  workCenterId: string | null;
  code: string;
  name: string;
  description: string | null;
  capacityPerDay: number;
  costPerHour: number | null;
  setupTimeDefault: number;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export function workstationToDTO(
  entity: ProductionWorkstation,
): WorkstationDTO {
  return {
    id: entity.workstationId.toString(),
    workstationTypeId: entity.workstationTypeId.toString(),
    workCenterId: entity.workCenterId?.toString() ?? null,
    code: entity.code,
    name: entity.name,
    description: entity.description,
    capacityPerDay: entity.capacityPerDay,
    costPerHour: entity.costPerHour,
    setupTimeDefault: entity.setupTimeDefault,
    isActive: entity.isActive,
    metadata: entity.metadata,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
