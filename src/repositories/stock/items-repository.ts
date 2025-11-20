import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';

export interface CreateItemSchema {
  uniqueCode: string;
  variantId: UniqueEntityID;
  locationId: UniqueEntityID;
  initialQuantity: number;
  currentQuantity: number;
  status: ItemStatus;
  entryDate?: Date;
  attributes?: Record<string, unknown>;
  batchNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
}

export interface UpdateItemSchema {
  id: UniqueEntityID;
  locationId?: UniqueEntityID;
  currentQuantity?: number;
  status?: ItemStatus;
  attributes?: Record<string, unknown>;
  batchNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
}

export interface ItemsRepository {
  create(data: CreateItemSchema): Promise<Item>;
  findById(id: UniqueEntityID): Promise<Item | null>;
  findByUniqueCode(uniqueCode: string): Promise<Item | null>;
  findAll(): Promise<Item[]>;
  findManyByVariant(variantId: UniqueEntityID): Promise<Item[]>;
  findManyByProduct(productId: UniqueEntityID): Promise<Item[]>;
  findManyByLocation(locationId: UniqueEntityID): Promise<Item[]>;
  findManyByStatus(status: ItemStatus): Promise<Item[]>;
  findManyByBatch(batchNumber: string): Promise<Item[]>;
  findManyExpiring(daysUntilExpiry: number): Promise<Item[]>;
  findManyExpired(): Promise<Item[]>;
  update(data: UpdateItemSchema): Promise<Item | null>;
  save(item: Item): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
