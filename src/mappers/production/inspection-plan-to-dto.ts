import type { ProductionInspectionPlan } from '@/entities/production/inspection-plan';

export interface InspectionPlanDTO {
  id: string;
  operationRoutingId: string;
  inspectionType: string;
  description: string | null;
  sampleSize: number;
  aqlLevel: string | null;
  instructions: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function inspectionPlanToDTO(
  entity: ProductionInspectionPlan,
): InspectionPlanDTO {
  return {
    id: entity.inspectionPlanId.toString(),
    operationRoutingId: entity.operationRoutingId.toString(),
    inspectionType: entity.inspectionType,
    description: entity.description,
    sampleSize: entity.sampleSize,
    aqlLevel: entity.aqlLevel,
    instructions: entity.instructions,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
