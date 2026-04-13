import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { QualityHoldStatus } from '@/entities/production/quality-hold';
import { ProductionQualityHold } from '@/entities/production/quality-hold';

export interface CreateQualityHoldSchema {
  productionOrderId: string;
  reason: string;
  holdById: string;
}

export interface ReleaseQualityHoldSchema {
  id: UniqueEntityID;
  releasedById: string;
  resolution: string;
}

export interface QualityHoldsRepository {
  create(data: CreateQualityHoldSchema): Promise<ProductionQualityHold>;
  findById(id: UniqueEntityID): Promise<ProductionQualityHold | null>;
  findMany(filters: {
    productionOrderId?: string;
    status?: QualityHoldStatus;
  }): Promise<ProductionQualityHold[]>;
  release(
    data: ReleaseQualityHoldSchema,
  ): Promise<ProductionQualityHold | null>;
}
