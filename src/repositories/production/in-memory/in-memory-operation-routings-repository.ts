import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionOperationRouting } from '@/entities/production/operation-routing';
import type {
  CreateOperationRoutingSchema,
  OperationRoutingsRepository,
  UpdateOperationRoutingSchema,
} from '../operation-routings-repository';

export class InMemoryOperationRoutingsRepository
  implements OperationRoutingsRepository
{
  public items: ProductionOperationRouting[] = [];

  async create(
    data: CreateOperationRoutingSchema,
  ): Promise<ProductionOperationRouting> {
    const routing = ProductionOperationRouting.create({
      tenantId: new EntityID(data.tenantId),
      bomId: new EntityID(data.bomId),
      workstationId: data.workstationId
        ? new EntityID(data.workstationId)
        : null,
      sequence: data.sequence,
      operationName: data.operationName,
      description: data.description ?? null,
      setupTime: data.setupTime,
      executionTime: data.executionTime,
      waitTime: data.waitTime,
      moveTime: data.moveTime,
      isQualityCheck: data.isQualityCheck ?? false,
      isOptional: data.isOptional ?? false,
      skillRequired: data.skillRequired ?? null,
      instructions: data.instructions ?? null,
      imageUrl: data.imageUrl ?? null,
    });

    this.items.push(routing);
    return routing;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionOperationRouting | null> {
    const item = this.items.find(
      (i) => i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(tenantId: string): Promise<ProductionOperationRouting[]> {
    return this.items.filter((i) => i.tenantId.toString() === tenantId);
  }

  async findManyByBomId(
    bomId: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionOperationRouting[]> {
    return this.items.filter(
      (i) => i.bomId.equals(bomId) && i.tenantId.toString() === tenantId,
    );
  }

  async update(
    data: UpdateOperationRoutingSchema,
  ): Promise<ProductionOperationRouting | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.bomId !== undefined) item.bomId = new EntityID(data.bomId);
    if (data.workstationId !== undefined)
      item.workstationId = data.workstationId
        ? new EntityID(data.workstationId)
        : null;
    if (data.sequence !== undefined) item.sequence = data.sequence;
    if (data.operationName !== undefined)
      item.operationName = data.operationName;
    if (data.description !== undefined) item.description = data.description;
    if (data.setupTime !== undefined) item.setupTime = data.setupTime;
    if (data.executionTime !== undefined)
      item.executionTime = data.executionTime;
    if (data.waitTime !== undefined) item.waitTime = data.waitTime;
    if (data.moveTime !== undefined) item.moveTime = data.moveTime;
    if (data.isQualityCheck !== undefined)
      item.isQualityCheck = data.isQualityCheck;
    if (data.isOptional !== undefined) item.isOptional = data.isOptional;
    if (data.skillRequired !== undefined)
      item.skillRequired = data.skillRequired;
    if (data.instructions !== undefined) item.instructions = data.instructions;
    if (data.imageUrl !== undefined) item.imageUrl = data.imageUrl;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
