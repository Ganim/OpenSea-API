import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionWorkstationType } from '@/entities/production/workstation-type';
import type {
  WorkstationTypesRepository,
  CreateWorkstationTypeSchema,
  UpdateWorkstationTypeSchema,
} from '../workstation-types-repository';

export class InMemoryWorkstationTypesRepository
  implements WorkstationTypesRepository
{
  public items: ProductionWorkstationType[] = [];

  async create(
    data: CreateWorkstationTypeSchema,
  ): Promise<ProductionWorkstationType> {
    const workstationType = ProductionWorkstationType.create({
      tenantId: new EntityID(data.tenantId),
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      isActive: data.isActive ?? true,
    });

    this.items.push(workstationType);
    return workstationType;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionWorkstationType | null> {
    const item = this.items.find(
      (i) =>
        i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(tenantId: string): Promise<ProductionWorkstationType[]> {
    return this.items.filter(
      (i) => i.tenantId.toString() === tenantId,
    );
  }

  async update(
    data: UpdateWorkstationTypeSchema,
  ): Promise<ProductionWorkstationType | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.name !== undefined) item.name = data.name;
    if (data.description !== undefined) item.description = data.description;
    if (data.icon !== undefined) item.icon = data.icon;
    if (data.color !== undefined) item.color = data.color;
    if (data.isActive !== undefined) item.isActive = data.isActive;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
