import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InventorySessionItem } from '@/entities/stock/inventory-session-item';
import type {
  CreateInventorySessionItemSchema,
  InventorySessionItemsRepository,
} from '../inventory-session-items-repository';

export class InMemoryInventorySessionItemsRepository
  implements InventorySessionItemsRepository
{
  public items: InventorySessionItem[] = [];

  async create(
    data: CreateInventorySessionItemSchema,
  ): Promise<InventorySessionItem> {
    const item = InventorySessionItem.create({
      sessionId: data.sessionId,
      itemId: data.itemId,
      expectedBinId: data.expectedBinId,
      actualBinId: data.actualBinId,
      status: data.status,
      notes: data.notes,
    });

    this.items.push(item);
    return item;
  }

  async createMany(
    data: CreateInventorySessionItemSchema[],
  ): Promise<InventorySessionItem[]> {
    const created: InventorySessionItem[] = [];
    for (const d of data) {
      const item = await this.create(d);
      created.push(item);
    }
    return created;
  }

  async findById(id: UniqueEntityID): Promise<InventorySessionItem | null> {
    const item = this.items.find((i) => i.id.equals(id));
    return item ?? null;
  }

  async findBySessionAndItem(
    sessionId: UniqueEntityID,
    itemId: UniqueEntityID,
  ): Promise<InventorySessionItem | null> {
    const item = this.items.find(
      (i) => i.sessionId.equals(sessionId) && i.itemId.equals(itemId),
    );
    return item ?? null;
  }

  async findManyBySession(
    sessionId: UniqueEntityID,
  ): Promise<InventorySessionItem[]> {
    return this.items.filter((i) => i.sessionId.equals(sessionId));
  }

  async save(item: InventorySessionItem): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(item.id));
    if (index >= 0) {
      this.items[index] = item;
    } else {
      this.items.push(item);
    }
  }
}
