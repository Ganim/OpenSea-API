import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionWorkCenter } from '@/entities/production/work-center';
import type {
  WorkCentersRepository,
  CreateWorkCenterSchema,
  UpdateWorkCenterSchema,
} from '../work-centers-repository';

export class InMemoryWorkCentersRepository implements WorkCentersRepository {
  public items: ProductionWorkCenter[] = [];

  async create(data: CreateWorkCenterSchema): Promise<ProductionWorkCenter> {
    const workCenter = ProductionWorkCenter.create({
      tenantId: new EntityID(data.tenantId),
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      isActive: data.isActive ?? true,
    });

    this.items.push(workCenter);
    return workCenter;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionWorkCenter | null> {
    const item = this.items.find(
      (i) =>
        i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<ProductionWorkCenter | null> {
    const item = this.items.find(
      (i) =>
        i.code.toLowerCase() === code.toLowerCase() &&
        i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(tenantId: string): Promise<ProductionWorkCenter[]> {
    return this.items.filter(
      (i) => i.tenantId.toString() === tenantId,
    );
  }

  async update(
    data: UpdateWorkCenterSchema,
  ): Promise<ProductionWorkCenter | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.code !== undefined) item.code = data.code;
    if (data.name !== undefined) item.name = data.name;
    if (data.description !== undefined) item.description = data.description;
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
