import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DealPrediction } from '@/entities/sales/deal-prediction';

export interface DealPredictionsRepository {
  create(prediction: DealPrediction): Promise<void>;
  findLatestByDealId(
    dealId: UniqueEntityID,
    tenantId: string,
  ): Promise<DealPrediction | null>;
  findManyByTenantId(tenantId: string): Promise<DealPrediction[]>;
}
