import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionWorkstation } from '@/entities/production/workstation';
import type {
  WorkstationsRepository,
  CreateWorkstationSchema,
  UpdateWorkstationSchema,
} from '../workstations-repository';

export class InMemoryWorkstationsRepository implements WorkstationsRepository {
  public items: ProductionWorkstation[] = [];

  async create(data: CreateWorkstationSchema): Promise<ProductionWorkstation> {
    const workstation = ProductionWorkstation.create({
      tenantId: new EntityID(data.tenantId),
      workstationTypeId: new EntityID(data.workstationTypeId),
      workCenterId: data.workCenterId
        ? new EntityID(data.workCenterId)
        : null,
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      capacityPerDay: data.capacityPerDay,
      costPerHour: data.costPerHour ?? null,
      setupTimeDefault: data.setupTimeDefault,
      isActive: data.isActive ?? true,
      metadata: data.metadata ?? null,
    });

    this.items.push(workstation);
    return workstation;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionWorkstation | null> {
    const item = this.items.find(
      (i) =>
        i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<ProductionWorkstation | null> {
    const item = this.items.find(
      (i) =>
        i.code.toLowerCase() === code.toLowerCase() &&
        i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(tenantId: string): Promise<ProductionWorkstation[]> {
    return this.items.filter(
      (i) => i.tenantId.toString() === tenantId,
    );
  }

  async findManyByWorkCenter(
    workCenterId: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionWorkstation[]> {
    return this.items.filter(
      (i) =>
        i.workCenterId?.equals(workCenterId) &&
        i.tenantId.toString() === tenantId,
    );
  }

  async update(
    data: UpdateWorkstationSchema,
  ): Promise<ProductionWorkstation | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.workstationTypeId !== undefined)
      item.workstationTypeId = new EntityID(data.workstationTypeId);
    if (data.workCenterId !== undefined)
      item.workCenterId = data.workCenterId
        ? new EntityID(data.workCenterId)
        : null;
    if (data.code !== undefined) item.code = data.code;
    if (data.name !== undefined) item.name = data.name;
    if (data.description !== undefined) item.description = data.description;
    if (data.capacityPerDay !== undefined)
      item.capacityPerDay = data.capacityPerDay;
    if (data.costPerHour !== undefined) item.costPerHour = data.costPerHour;
    if (data.setupTimeDefault !== undefined)
      item.setupTimeDefault = data.setupTimeDefault;
    if (data.isActive !== undefined) item.isActive = data.isActive;
    if (data.metadata !== undefined) item.metadata = data.metadata;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
