import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionCostType } from '@/entities/production/production-cost';
import { ProductionCost } from '@/entities/production/production-cost';
import type {
  CreateProductionCostSchema,
  ProductionCostsRepository,
  UpdateProductionCostSchema,
} from '../production-costs-repository';

export class InMemoryProductionCostsRepository
  implements ProductionCostsRepository
{
  public items: ProductionCost[] = [];

  async create(data: CreateProductionCostSchema): Promise<ProductionCost> {
    const cost = ProductionCost.create({
      productionOrderId: new EntityID(data.productionOrderId),
      costType: data.costType as ProductionCostType,
      description: data.description ?? null,
      plannedAmount: data.plannedAmount,
      actualAmount: data.actualAmount,
      varianceAmount: data.varianceAmount,
    });

    this.items.push(cost);
    return cost;
  }

  async findById(id: UniqueEntityID): Promise<ProductionCost | null> {
    const item = this.items.find((i) => i.id.equals(id));
    return item ?? null;
  }

  async findManyByOrderId(productionOrderId: string): Promise<ProductionCost[]> {
    return this.items.filter(
      (i) => i.productionOrderId.toString() === productionOrderId,
    );
  }

  async update(
    data: UpdateProductionCostSchema,
  ): Promise<ProductionCost | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.costType !== undefined) item.costType = data.costType;
    if (data.description !== undefined) item.description = data.description;
    if (data.plannedAmount !== undefined) item.plannedAmount = data.plannedAmount;
    if (data.actualAmount !== undefined) item.actualAmount = data.actualAmount;
    if (data.varianceAmount !== undefined)
      item.varianceAmount = data.varianceAmount;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
