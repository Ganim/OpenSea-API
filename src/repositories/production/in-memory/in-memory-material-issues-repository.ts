import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionMaterialIssue } from '@/entities/production/material-issue';
import type {
  CreateMaterialIssueSchema,
  MaterialIssuesRepository,
} from '../material-issues-repository';

export class InMemoryMaterialIssuesRepository
  implements MaterialIssuesRepository
{
  public items: ProductionMaterialIssue[] = [];

  async create(
    data: CreateMaterialIssueSchema,
  ): Promise<ProductionMaterialIssue> {
    const materialIssue = ProductionMaterialIssue.create({
      productionOrderId: new EntityID(data.productionOrderId),
      materialId: new EntityID(data.materialId),
      warehouseId: new EntityID(data.warehouseId),
      quantity: data.quantity,
      batchNumber: data.batchNumber ?? null,
      issuedById: new EntityID(data.issuedById),
      notes: data.notes ?? null,
    });

    this.items.push(materialIssue);
    return materialIssue;
  }

  async findById(
    id: UniqueEntityID,
  ): Promise<ProductionMaterialIssue | null> {
    const item = this.items.find(
      (i) => i.materialIssueId.toString() === id.toString(),
    );
    return item ?? null;
  }

  async findManyByProductionOrderId(
    productionOrderId: UniqueEntityID,
  ): Promise<ProductionMaterialIssue[]> {
    return this.items.filter(
      (i) => i.productionOrderId.toString() === productionOrderId.toString(),
    );
  }
}
