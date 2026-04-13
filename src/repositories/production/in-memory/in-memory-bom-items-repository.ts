import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionBomItem } from '@/entities/production/bom-item';
import type {
  BomItemsRepository,
  CreateBomItemSchema,
  UpdateBomItemSchema,
} from '../bom-items-repository';

export class InMemoryBomItemsRepository implements BomItemsRepository {
  public items: ProductionBomItem[] = [];

  async create(data: CreateBomItemSchema): Promise<ProductionBomItem> {
    const bomItem = ProductionBomItem.create({
      bomId: new EntityID(data.bomId),
      materialId: new EntityID(data.materialId),
      sequence: data.sequence,
      quantity: data.quantity,
      unit: data.unit,
      wastagePercent: data.wastagePercent ?? 0,
      isOptional: data.isOptional ?? false,
      substituteForId: data.substituteForId
        ? new EntityID(data.substituteForId)
        : null,
      notes: data.notes ?? null,
    });

    this.items.push(bomItem);
    return bomItem;
  }

  async findById(id: UniqueEntityID): Promise<ProductionBomItem | null> {
    const item = this.items.find((i) => i.id.equals(id));
    return item ?? null;
  }

  async findManyByBomId(bomId: UniqueEntityID): Promise<ProductionBomItem[]> {
    return this.items.filter((i) => i.bomId.equals(bomId));
  }

  async update(data: UpdateBomItemSchema): Promise<ProductionBomItem | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.materialId !== undefined)
      item.materialId = new EntityID(data.materialId);
    if (data.sequence !== undefined) item.sequence = data.sequence;
    if (data.quantity !== undefined) item.quantity = data.quantity;
    if (data.unit !== undefined) item.unit = data.unit;
    if (data.wastagePercent !== undefined)
      item.wastagePercent = data.wastagePercent;
    if (data.isOptional !== undefined) item.isOptional = data.isOptional;
    if (data.substituteForId !== undefined)
      item.substituteForId = data.substituteForId
        ? new EntityID(data.substituteForId)
        : null;
    if (data.notes !== undefined) item.notes = data.notes;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  async deleteByBomId(bomId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((i) => !i.bomId.equals(bomId));
  }
}
