import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionInspectionPlan } from '@/entities/production/inspection-plan';
import type {
  CreateInspectionPlanSchema,
  InspectionPlansRepository,
  UpdateInspectionPlanSchema,
} from '../inspection-plans-repository';

export class InMemoryInspectionPlansRepository
  implements InspectionPlansRepository
{
  public items: ProductionInspectionPlan[] = [];

  async create(
    data: CreateInspectionPlanSchema,
  ): Promise<ProductionInspectionPlan> {
    const inspectionPlan = ProductionInspectionPlan.create({
      operationRoutingId: new EntityID(data.operationRoutingId),
      inspectionType: data.inspectionType,
      description: data.description ?? null,
      sampleSize: data.sampleSize,
      aqlLevel: data.aqlLevel ?? null,
      instructions: data.instructions ?? null,
      isActive: data.isActive ?? true,
    });

    this.items.push(inspectionPlan);
    return inspectionPlan;
  }

  async findById(
    id: UniqueEntityID,
  ): Promise<ProductionInspectionPlan | null> {
    const item = this.items.find(
      (i) => i.inspectionPlanId.toString() === id.toString(),
    );
    return item ?? null;
  }

  async findManyByOperationRoutingId(
    operationRoutingId: string,
  ): Promise<ProductionInspectionPlan[]> {
    return this.items.filter(
      (i) => i.operationRoutingId.toString() === operationRoutingId,
    );
  }

  async update(
    data: UpdateInspectionPlanSchema,
  ): Promise<ProductionInspectionPlan | null> {
    const item = this.items.find(
      (i) => i.inspectionPlanId.toString() === data.id.toString(),
    );
    if (!item) return null;

    if (data.inspectionType !== undefined)
      item.inspectionType = data.inspectionType;
    if (data.description !== undefined) item.description = data.description;
    if (data.sampleSize !== undefined) item.sampleSize = data.sampleSize;
    if (data.aqlLevel !== undefined) item.aqlLevel = data.aqlLevel;
    if (data.instructions !== undefined) item.instructions = data.instructions;
    if (data.isActive !== undefined) item.isActive = data.isActive;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex(
      (i) => i.inspectionPlanId.toString() === id.toString(),
    );
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
