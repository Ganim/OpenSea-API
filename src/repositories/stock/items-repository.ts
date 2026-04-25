import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import type { Slug } from '@/entities/stock/value-objects/slug';
import type { TransactionClient } from '@/lib/transaction-manager';
import type { PaginatedResult, PaginationParams } from '../pagination-params';

export interface ItemRelatedData {
  productCode: string | null;
  productName: string;
  variantSku: string;
  variantName: string;
  variantReference?: string | null;
  binId?: string;
  binAddress?: string;
  zoneId?: string;
  zoneWarehouseId?: string;
  zoneCode?: string;
  zoneName?: string;
  templateId?: string;
  templateName?: string;
  templateUnitOfMeasure?: string;
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  variantColorHex?: string;
  variantSecondaryColorHex?: string;
  variantPattern?: string;
  manufacturerName?: string;
  productId?: string;
  templateProductAttributes?: Record<string, unknown>;
  templateVariantAttributes?: Record<string, unknown>;
  templateItemAttributes?: Record<string, unknown>;
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
  lastKnownAddress?: string; // Último endereço conhecido do bin
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
  lastKnownAddress?: string;
  currentQuantity?: number;
  status?: ItemStatus;
  attributes?: Record<string, unknown>;
  batchNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
}

export interface VariantItemsStats {
  totalItems: number;
  inStockItems: number;
  totalQuantity: number;
  inStockQuantity: number;
}

export interface ItemListFilters {
  search?: string;
  manufacturerId?: string;
  zoneId?: string;
  status?: string;
  hideEmpty?: boolean;
  updatedFrom?: Date;
  updatedTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ItemsRepository {
  create(data: CreateItemSchema): Promise<Item>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Item | null>;
  findManyByIds(ids: UniqueEntityID[], tenantId: string): Promise<Item[]>;
  findByUniqueCode(uniqueCode: string, tenantId: string): Promise<Item | null>;
  findByFullCode(fullCode: string, tenantId: string): Promise<Item | null>;
  findByBarcode(barcode: string, tenantId: string): Promise<Item | null>;
  findByEanCode(eanCode: string, tenantId: string): Promise<Item | null>;
  findByUpcCode(upcCode: string, tenantId: string): Promise<Item | null>;
  findByAnyCode(code: string, tenantId: string): Promise<Item | null>;
  findAll(tenantId: string): Promise<Item[]>;
  countByVariantId(
    variantId: UniqueEntityID,
    tenantId: string,
  ): Promise<number>;
  findManyByVariant(
    variantId: UniqueEntityID,
    tenantId: string,
  ): Promise<Item[]>;
  /**
   * Bulk lookup of items whose `bin.zoneId` is in the supplied set, scoped to
   * a tenant. Used by the POS catalog delta endpoint (Emporion Phase 1) to
   * select the items that belong to the zones associated with the requesting
   * terminal.
   *
   * When `sinceDate` is provided, only items with `updatedAt >= sinceDate`
   * are returned (incremental sync). Skips soft-deleted rows. Items without a
   * `binId` (i.e. unallocated) are excluded — the catalog delta only ships
   * items that are physically present in one of the terminal's zones. Returns
   * `[]` for an empty `zoneIds` argument without hitting the database.
   */
  findManyByZoneIds(
    zoneIds: string[],
    tenantId: string,
    sinceDate?: Date,
  ): Promise<Item[]>;
  /**
   * Cursor-paginated lookup of items whose `bin.zoneId` is in the supplied
   * set, scoped to a tenant. Used by the POS catalog full-sync endpoint
   * (Emporion Phase 1) for initial and recovery syncs — when the device has
   * no local state yet, or when the incremental delta would be too large to
   * ship in a single response.
   *
   * Cursor semantics: `cursor` is the last `Item.id` returned by the previous
   * page; the next page starts at the *first* row whose `id` is strictly
   * greater than `cursor`. Items are sorted by `id ASC` (UUID lex order) for
   * stability — `updatedAt` is intentionally not used because rows edited
   * mid-sync would skip pages.
   *
   * Returns at most `limit` items plus a `nextCursor` set to the last item's
   * `id` when another page exists; `nextCursor` is `null` on the final page.
   * Skips soft-deleted rows and items without a `binId`. Returns
   * `{ items: [], nextCursor: null }` for an empty `zoneIds` argument without
   * hitting the database.
   */
  findManyByZoneIdsPaginated(
    zoneIds: string[],
    tenantId: string,
    options: {
      cursor?: string;
      limit: number;
    },
  ): Promise<{ items: Item[]; nextCursor: string | null }>;
  findManyByProduct(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<Item[]>;
  findManyByBin(binId: UniqueEntityID, tenantId: string): Promise<Item[]>;
  findManyByBatch(batchNumber: string, tenantId: string): Promise<Item[]>;
  findLastByVariantId(
    variantId: UniqueEntityID,
    tenantId: string,
  ): Promise<Item | null>;
  update(data: UpdateItemSchema): Promise<Item | null>;
  save(item: Item, tx?: TransactionClient): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  detachItemsFromBins(binIds: string[], tenantId: string): Promise<number>;
  atomicDecrement(
    id: UniqueEntityID,
    quantity: number,
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<Item>;

  // Methods with relations (for list/get with related data)
  findAllWithRelationsPaginated(
    tenantId: string,
    params: PaginationParams,
    filters?: ItemListFilters,
  ): Promise<PaginatedResult<ItemWithRelationsDTO>>;
  findByIdWithRelations(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO | null>;
  findManyByVariantWithRelations(
    variantId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO[]>;
  findManyByVariantWithRelationsPaginated(
    variantId: UniqueEntityID,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemWithRelationsDTO>>;
  findManyByProductWithRelations(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO[]>;
  findManyByProductWithRelationsPaginated(
    productId: UniqueEntityID,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemWithRelationsDTO>>;
  findManyByBinWithRelations(
    binId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO[]>;
  findManyByBinWithRelationsPaginated(
    binId: UniqueEntityID,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemWithRelationsDTO>>;
  findManyByBatchWithRelationsPaginated(
    batchNumber: string,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemWithRelationsDTO>>;
  getStatsByVariant(
    variantId: UniqueEntityID,
    tenantId: string,
  ): Promise<VariantItemsStats>;
}
