import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { QualityHoldStatus } from '@/entities/production/quality-hold';
import { ProductionQualityHold } from '@/entities/production/quality-hold';
import type {
  CreateQualityHoldSchema,
  QualityHoldsRepository,
  ReleaseQualityHoldSchema,
} from '../quality-holds-repository';

export class InMemoryQualityHoldsRepository implements QualityHoldsRepository {
  public items: ProductionQualityHold[] = [];

  async create(
    data: CreateQualityHoldSchema,
  ): Promise<ProductionQualityHold> {
    const hold = ProductionQualityHold.create({
      productionOrderId: new EntityID(data.productionOrderId),
      reason: data.reason,
      holdById: data.holdById,
    });

    this.items.push(hold);
    return hold;
  }

  async findById(id: UniqueEntityID): Promise<ProductionQualityHold | null> {
    const item = this.items.find((i) => i.id.equals(id));
    return item ?? null;
  }

  async findMany(filters: {
    productionOrderId?: string;
    status?: QualityHoldStatus;
  }): Promise<ProductionQualityHold[]> {
    let results = [...this.items];

    if (filters.productionOrderId) {
      results = results.filter(
        (i) =>
          i.productionOrderId.toString() === filters.productionOrderId,
      );
    }

    if (filters.status) {
      results = results.filter((i) => i.status === filters.status);
    }

    return results;
  }

  async release(
    data: ReleaseQualityHoldSchema,
  ): Promise<ProductionQualityHold | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    item.release(data.releasedById, data.resolution);
    return item;
  }
}
