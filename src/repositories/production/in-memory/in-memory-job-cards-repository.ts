import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionJobCardStatus } from '@/entities/production/job-card';
import { ProductionJobCard } from '@/entities/production/job-card';
import type {
  CreateJobCardSchema,
  JobCardsRepository,
  UpdateJobCardSchema,
} from '../job-cards-repository';

export class InMemoryJobCardsRepository implements JobCardsRepository {
  public items: ProductionJobCard[] = [];

  async create(data: CreateJobCardSchema): Promise<ProductionJobCard> {
    const jobCard = ProductionJobCard.create({
      productionOrderId: new EntityID(data.productionOrderId),
      operationRoutingId: new EntityID(data.operationRoutingId),
      workstationId: data.workstationId
        ? new EntityID(data.workstationId)
        : null,
      status: (data.status ?? 'PENDING') as ProductionJobCardStatus,
      quantityPlanned: data.quantityPlanned,
      quantityCompleted: data.quantityCompleted ?? 0,
      quantityScrapped: data.quantityScrapped ?? 0,
      scheduledStart: data.scheduledStart ?? null,
      scheduledEnd: data.scheduledEnd ?? null,
      actualStart: data.actualStart ?? null,
      actualEnd: data.actualEnd ?? null,
      barcode: data.barcode ?? null,
    });

    this.items.push(jobCard);
    return jobCard;
  }

  async findById(id: UniqueEntityID): Promise<ProductionJobCard | null> {
    const item = this.items.find((i) => i.id.equals(id));
    return item ?? null;
  }

  async findManyByProductionOrderId(
    productionOrderId: UniqueEntityID,
  ): Promise<ProductionJobCard[]> {
    return this.items.filter(
      (i) => i.productionOrderId.toString() === productionOrderId.toString(),
    );
  }

  async findManyByWorkstationId(
    workstationId: UniqueEntityID,
  ): Promise<ProductionJobCard[]> {
    return this.items.filter(
      (i) =>
        i.workstationId &&
        i.workstationId.toString() === workstationId.toString(),
    );
  }

  async update(data: UpdateJobCardSchema): Promise<ProductionJobCard | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.operationRoutingId !== undefined)
      item.operationRoutingId = new EntityID(data.operationRoutingId);
    if (data.workstationId !== undefined)
      item.workstationId = data.workstationId
        ? new EntityID(data.workstationId)
        : null;
    if (data.status !== undefined) item.status = data.status;
    if (data.quantityPlanned !== undefined)
      item.quantityPlanned = data.quantityPlanned;
    if (data.quantityCompleted !== undefined)
      item.quantityCompleted = data.quantityCompleted;
    if (data.quantityScrapped !== undefined)
      item.quantityScrapped = data.quantityScrapped;
    if (data.scheduledStart !== undefined)
      item.scheduledStart = data.scheduledStart;
    if (data.scheduledEnd !== undefined) item.scheduledEnd = data.scheduledEnd;
    if (data.actualStart !== undefined) item.actualStart = data.actualStart;
    if (data.actualEnd !== undefined) item.actualEnd = data.actualEnd;
    if (data.barcode !== undefined) item.barcode = data.barcode;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
