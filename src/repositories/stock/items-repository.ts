import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import type { Slug } from '@/entities/stock/value-objects/slug';

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
  tenantId: string;
  uniqueCode?: string; // Código único manual ou UUID (opcional)
  slug: Slug; // Slug gerado automaticamente - IMUTÁVEL
  fullCode: string; // Código hierárquico gerado: TEMPLATE.FABRICANTE.PRODUTO.VARIANTE-ITEM
  sequentialCode: number; // Sequencial local à variante
  barcode: string; // Code128 baseado no fullCode - IMUTÁVEL
  eanCode: string; // EAN-13 gerado do fullCode - IMUTÁVEL
  upcCode: string; // UPC gerado do fullCode - IMUTÁVEL
  variantId: UniqueEntityID;
  binId?: UniqueEntityID; // Referência ao bin onde o item está armazenado
  initialQuantity: number;
  currentQuantity: number;
  unitCost?: number; // Custo unitário do item
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
  findById(id: UniqueEntityID, tenantId: string): Promise<Item | null>;
  findByUniqueCode(uniqueCode: string, tenantId: string): Promise<Item | null>;
  findAll(tenantId: string): Promise<Item[]>;
  findManyByVariant(
    variantId: UniqueEntityID,
    tenantId: string,
  ): Promise<Item[]>;
  findManyByProduct(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<Item[]>;
  findManyByBin(binId: UniqueEntityID, tenantId: string): Promise<Item[]>;
  findManyByStatus(status: ItemStatus, tenantId: string): Promise<Item[]>;
  findManyByBatch(batchNumber: string, tenantId: string): Promise<Item[]>;
  findManyExpiring(daysUntilExpiry: number, tenantId: string): Promise<Item[]>;
  findManyExpired(tenantId: string): Promise<Item[]>;
  findLastByVariantId(
    variantId: UniqueEntityID,
    tenantId: string,
  ): Promise<Item | null>;
  update(data: UpdateItemSchema): Promise<Item | null>;
  save(item: Item): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;

  // Methods with relations (for list/get with related data)
  findAllWithRelations(tenantId: string): Promise<ItemWithRelationsDTO[]>;
  findByIdWithRelations(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO | null>;
  findManyByVariantWithRelations(
    variantId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO[]>;
  findManyByProductWithRelations(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO[]>;
  findManyByBinWithRelations(
    binId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO[]>;
}
