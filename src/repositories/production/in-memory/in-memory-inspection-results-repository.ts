import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionInspectionResult } from '@/entities/production/inspection-result';
import type { InspectionStatus } from '@/entities/production/inspection-result';
import type {
  CreateInspectionResultSchema,
  InspectionResultsRepository,
  UpdateInspectionResultSchema,
} from '../inspection-results-repository';

export class InMemoryInspectionResultsRepository
  implements InspectionResultsRepository
{
  public items: ProductionInspectionResult[] = [];

  async create(
    data: CreateInspectionResultSchema,
  ): Promise<ProductionInspectionResult> {
    const inspectionResult = ProductionInspectionResult.create({
      inspectionPlanId: new EntityID(data.inspectionPlanId),
      productionOrderId: new EntityID(data.productionOrderId),
      inspectedById: new EntityID(data.inspectedById),
      sampleSize: data.sampleSize,
      defectsFound: data.defectsFound ?? 0,
      status: (data.status as InspectionStatus) ?? 'PENDING',
      notes: data.notes ?? null,
    });

    this.items.push(inspectionResult);
    return inspectionResult;
  }

  async findById(
    id: UniqueEntityID,
  ): Promise<ProductionInspectionResult | null> {
    const item = this.items.find(
      (i) => i.inspectionResultId.toString() === id.toString(),
    );
    return item ?? null;
  }

  async findManyByOrderId(
    productionOrderId: string,
  ): Promise<ProductionInspectionResult[]> {
    return this.items.filter(
      (i) => i.productionOrderId.toString() === productionOrderId,
    );
  }

  async update(
    data: UpdateInspectionResultSchema,
  ): Promise<ProductionInspectionResult | null> {
    const item = this.items.find(
      (i) => i.inspectionResultId.toString() === data.id.toString(),
    );
    if (!item) return null;

    if (data.defectsFound !== undefined) item.defectsFound = data.defectsFound;
    if (data.notes !== undefined) item.notes = data.notes;
    if (data.status !== undefined) {
      if (data.status === 'PASSED') item.pass();
      else if (data.status === 'FAILED') item.fail();
      else if (data.status === 'CONDITIONAL') item.conditional();
    }

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex(
      (i) => i.inspectionResultId.toString() === id.toString(),
    );
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
