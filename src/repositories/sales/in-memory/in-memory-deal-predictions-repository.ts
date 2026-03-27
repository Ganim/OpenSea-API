import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DealPrediction } from '@/entities/sales/deal-prediction';
import type { DealPredictionsRepository } from '../deal-predictions-repository';

export class InMemoryDealPredictionsRepository
  implements DealPredictionsRepository
{
  public items: DealPrediction[] = [];

  async create(prediction: DealPrediction): Promise<void> {
    this.items.push(prediction);
  }

  async findLatestByDealId(
    dealId: UniqueEntityID,
    tenantId: string,
  ): Promise<DealPrediction | null> {
    const predictions = this.items
      .filter(
        (item) =>
          item.dealId.equals(dealId) && item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return predictions[0] ?? null;
  }

  async findManyByTenantId(tenantId: string): Promise<DealPrediction[]> {
    return this.items.filter((item) => item.tenantId.toString() === tenantId);
  }
}
