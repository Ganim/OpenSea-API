import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';

export interface ItemRelatedData {
  productCode: string | null;
  productName: string;
  variantSku: string;
  variantName: string;
  binId?: string;
  binAddress?: string;
  zoneId?: string;
  zoneWarehouseId?: string;
  zoneCode?: string;
  zoneName?: string;
}

export interface ItemWithRelationsDTO {
  item: Item;
  relatedData: ItemRelatedData;
}

export interface CreateItemSchema {
  uniqueCode: string;
  variantId: UniqueEntityID;
  binId?: UniqueEntityID; // Referência ao bin onde o item está armazenado
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
  binId?: UniqueEntityID;
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
  findManyByBin(binId: UniqueEntityID): Promise<Item[]>;
  findManyByStatus(status: ItemStatus): Promise<Item[]>;
  findManyByBatch(batchNumber: string): Promise<Item[]>;
  findManyExpiring(daysUntilExpiry: number): Promise<Item[]>;
  findManyExpired(): Promise<Item[]>;
  update(data: UpdateItemSchema): Promise<Item | null>;
  save(item: Item): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;

  // Methods with relations (for list/get with related data)
  findAllWithRelations(): Promise<ItemWithRelationsDTO[]>;
  findByIdWithRelations(id: UniqueEntityID): Promise<ItemWithRelationsDTO | null>;
  findManyByVariantWithRelations(variantId: UniqueEntityID): Promise<ItemWithRelationsDTO[]>;
  findManyByProductWithRelations(productId: UniqueEntityID): Promise<ItemWithRelationsDTO[]>;
  findManyByBinWithRelations(binId: UniqueEntityID): Promise<ItemWithRelationsDTO[]>;
}
