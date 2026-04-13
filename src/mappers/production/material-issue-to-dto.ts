import type { ProductionMaterialIssue } from '@/entities/production/material-issue';

export interface MaterialIssueDTO {
  id: string;
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  batchNumber: string | null;
  issuedById: string;
  issuedAt: Date;
  notes: string | null;
}

export function materialIssueToDTO(
  entity: ProductionMaterialIssue,
): MaterialIssueDTO {
  return {
    id: entity.materialIssueId.toString(),
    productionOrderId: entity.productionOrderId.toString(),
    materialId: entity.materialId.toString(),
    warehouseId: entity.warehouseId.toString(),
    quantity: entity.quantity,
    batchNumber: entity.batchNumber,
    issuedById: entity.issuedById.toString(),
    issuedAt: entity.issuedAt,
    notes: entity.notes,
  };
}
