import type { ProductionInspectionResult } from '@/entities/production/inspection-result';

export interface InspectionResultDTO {
  id: string;
  inspectionPlanId: string;
  productionOrderId: string;
  inspectedById: string;
  inspectedAt: Date;
  sampleSize: number;
  defectsFound: number;
  status: string;
  notes: string | null;
  createdAt: Date;
}

export function inspectionResultToDTO(
  entity: ProductionInspectionResult,
): InspectionResultDTO {
  return {
    id: entity.inspectionResultId.toString(),
    inspectionPlanId: entity.inspectionPlanId.toString(),
    productionOrderId: entity.productionOrderId.toString(),
    inspectedById: entity.inspectedById.toString(),
    inspectedAt: entity.inspectedAt,
    sampleSize: entity.sampleSize,
    defectsFound: entity.defectsFound,
    status: entity.status,
    notes: entity.notes,
    createdAt: entity.createdAt,
  };
}
