import type { ProductionMaterialReturn } from '@/entities/production/material-return';

export interface MaterialReturnDTO {
  id: string;
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  reason: string | null;
  returnedById: string;
  returnedAt: Date;
}

export function materialReturnToDTO(
  entity: ProductionMaterialReturn,
): MaterialReturnDTO {
  return {
    id: entity.materialReturnId.toString(),
    productionOrderId: entity.productionOrderId.toString(),
    materialId: entity.materialId.toString(),
    warehouseId: entity.warehouseId.toString(),
    quantity: entity.quantity,
    reason: entity.reason,
    returnedById: entity.returnedById.toString(),
    returnedAt: entity.returnedAt,
  };
}
