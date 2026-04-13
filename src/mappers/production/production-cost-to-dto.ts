import type { ProductionCost } from '@/entities/production/production-cost';

export interface ProductionCostDTO {
  id: string;
  productionOrderId: string;
  costType: string;
  description: string | null;
  plannedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function productionCostToDTO(entity: ProductionCost): ProductionCostDTO {
  return {
    id: entity.productionCostId.toString(),
    productionOrderId: entity.productionOrderId.toString(),
    costType: entity.costType,
    description: entity.description,
    plannedAmount: entity.plannedAmount,
    actualAmount: entity.actualAmount,
    varianceAmount: entity.varianceAmount,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
