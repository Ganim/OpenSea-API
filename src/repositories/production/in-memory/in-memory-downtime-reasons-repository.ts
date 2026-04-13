import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionDowntimeReason } from '@/entities/production/downtime-reason';
import type {
  CreateDowntimeReasonSchema,
  DowntimeReasonsRepository,
  UpdateDowntimeReasonSchema,
} from '../downtime-reasons-repository';

export class InMemoryDowntimeReasonsRepository
  implements DowntimeReasonsRepository
{
  public items: ProductionDowntimeReason[] = [];

  async create(
    data: CreateDowntimeReasonSchema,
  ): Promise<ProductionDowntimeReason> {
    const reason = ProductionDowntimeReason.create({
      tenantId: new EntityID(data.tenantId),
      code: data.code,
      name: data.name,
      category: data.category,
      isActive: data.isActive ?? true,
    });

    this.items.push(reason);
    return reason;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionDowntimeReason | null> {
    const item = this.items.find(
      (i) => i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<ProductionDowntimeReason | null> {
    const item = this.items.find(
      (i) => i.code === code && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(tenantId: string): Promise<ProductionDowntimeReason[]> {
    return this.items.filter((i) => i.tenantId.toString() === tenantId);
  }

  async update(
    data: UpdateDowntimeReasonSchema,
  ): Promise<ProductionDowntimeReason | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.code !== undefined) item.code = data.code;
    if (data.name !== undefined) item.name = data.name;
    if (data.category !== undefined) item.category = data.category;
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
