import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PriceTableItem } from '@/entities/sales/price-table-item';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface CreatePriceTableItemSchema {
  priceTableId: string;
  tenantId: string;
  variantId: string;
  price: number;
  minQuantity?: number;
  maxQuantity?: number;
  costPrice?: number;
  marginPercent?: number;
}

export interface FindManyPriceTableItemsParams {
  priceTableId: string;
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PriceTableItemsRepository {
  create(data: CreatePriceTableItemSchema): Promise<PriceTableItem>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PriceTableItem | null>;
  findByTableAndVariant(
    priceTableId: string,
    variantId: string,
    tenantId: string,
    minQuantity?: number,
  ): Promise<PriceTableItem | null>;
  findBestForVariantInTable(
    priceTableId: string,
    variantId: string,
    quantity: number,
  ): Promise<PriceTableItem | null>;
  findManyByTable(params: FindManyPriceTableItemsParams): Promise<PaginatedResult<PriceTableItem>>;
  upsert(data: CreatePriceTableItemSchema): Promise<PriceTableItem>;
  bulkCreate(items: CreatePriceTableItemSchema[]): Promise<PriceTableItem[]>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
