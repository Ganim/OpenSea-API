import type { ProductionDefectType } from '@/entities/production/defect-type';

export interface DefectTypeDTO {
  id: string;
  code: string;
  name: string;
  description: string | null;
  severity: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function defectTypeToDTO(entity: ProductionDefectType): DefectTypeDTO {
  return {
    id: entity.defectTypeId.toString(),
    code: entity.code,
    name: entity.name,
    description: entity.description,
    severity: entity.severity,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
