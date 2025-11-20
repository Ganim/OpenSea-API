import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import type {
    CreateItemSchema,
    ItemsRepository,
    UpdateItemSchema,
} from '../items-repository';

export class InMemoryItemsRepository implements ItemsRepository {
  public items: Item[] = [];

  async create(data: CreateItemSchema): Promise<Item> {
    const item = Item.create({
      uniqueCode: data.uniqueCode,
      variantId: data.variantId,
      locationId: data.locationId,
      initialQuantity: data.initialQuantity,
      currentQuantity: data.currentQuantity,
      status: data.status,
      entryDate: data.entryDate ?? new Date(),
      attributes: data.attributes ?? {},
      batchNumber: data.batchNumber,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
    });

    this.items.push(item);
    return item;
  }

  async findById(id: UniqueEntityID): Promise<Item | null> {
    const item = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    return item ?? null;
  }

  async findByUniqueCode(uniqueCode: string): Promise<Item | null> {
    const item = this.items.find(
      (item) => !item.deletedAt && item.uniqueCode === uniqueCode,
    );
    return item ?? null;
  }

  async findAll(): Promise<Item[]> {
    return this.items.filter((item) => !item.deletedAt);
  }

  async findManyByVariant(variantId: UniqueEntityID): Promise<Item[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.variantId.equals(variantId),
    );
  }

  async findManyByLocation(locationId: UniqueEntityID): Promise<Item[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.locationId.equals(locationId),
    );
  }

  async findManyByStatus(status: ItemStatus): Promise<Item[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.status.value === status.value,
    );
  }

  async findManyByBatch(batchNumber: string): Promise<Item[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.batchNumber === batchNumber,
    );
  }

  async findManyExpiring(daysUntilExpiry: number): Promise<Item[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.expiryDate !== null &&
        item.daysUntilExpiry !== null &&
        item.daysUntilExpiry <= daysUntilExpiry &&
        item.daysUntilExpiry > 0,
    );
  }

  async findManyExpired(): Promise<Item[]> {
    return this.items.filter((item) => !item.deletedAt && item.isExpired);
  }

  async findManyByProduct(productId: UniqueEntityID): Promise<Item[]> {
    // In memory repository doesn't have product-variant relationship
    // For testing purposes, we'll return empty array
    return [];
  }

  async update(data: UpdateItemSchema): Promise<Item | null> {
    const item = await this.findById(data.id);
    if (!item) return null;

    if (data.locationId !== undefined) item.locationId = data.locationId;
    if (data.currentQuantity !== undefined)
      item.currentQuantity = data.currentQuantity;
    if (data.status !== undefined) item.status = data.status;
    if (data.attributes !== undefined) item.attributes = data.attributes;
    if (data.batchNumber !== undefined) item.batchNumber = data.batchNumber;
    if (data.manufacturingDate !== undefined)
      item.manufacturingDate = data.manufacturingDate;
    if (data.expiryDate !== undefined) item.expiryDate = data.expiryDate;

    return item;
  }

  async save(item: Item): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(item.id));
    if (index >= 0) {
      this.items[index] = item;
    } else {
      this.items.push(item);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const item = await this.findById(id);
    if (item) {
      item.delete();
    }
  }
}
