import type { ProductionQualityHold } from '@/entities/production/quality-hold';

export interface QualityHoldDTO {
  id: string;
  productionOrderId: string;
  reason: string;
  status: string;
  holdById: string;
  holdAt: Date;
  releasedById: string | null;
  releasedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function qualityHoldToDTO(
  entity: ProductionQualityHold,
): QualityHoldDTO {
  return {
    id: entity.qualityHoldId.toString(),
    productionOrderId: entity.productionOrderId.toString(),
    reason: entity.reason,
    status: entity.status,
    holdById: entity.holdById,
    holdAt: entity.holdAt,
    releasedById: entity.releasedById,
    releasedAt: entity.releasedAt,
    resolution: entity.resolution,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
