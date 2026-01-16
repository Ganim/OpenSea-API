import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Variant } from '@/entities/stock/variant';

export interface CreateVariantSchema {
  productId: UniqueEntityID;
  sku: string;
  name: string;
  price: number;
  imageUrl?: string;
  costPrice?: number;
  profitMargin?: number;
  barcode?: string;
  qrCode?: string;
  eanCode?: string;
  upcCode?: string;
  colorHex?: string;
  colorPantone?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  attributes?: Record<string, unknown>;
  reference?: string;
  similars?: unknown[];
  outOfLine?: boolean;
  isActive?: boolean;
}

export interface UpdateVariantSchema {
  id: UniqueEntityID;
  sku?: string;
  name?: string;
  price?: number;
  imageUrl?: string;
  costPrice?: number;
  profitMargin?: number;
  barcode?: string;
  qrCode?: string;
  eanCode?: string;
  upcCode?: string;
  colorHex?: string;
  colorPantone?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  attributes?: Record<string, unknown>;
  reference?: string;
  similars?: unknown[];
  outOfLine?: boolean;
  isActive?: boolean;
}

export interface VariantsRepository {
  create(data: CreateVariantSchema): Promise<Variant>;
  findById(id: UniqueEntityID): Promise<Variant | null>;
  findBySKU(sku: string): Promise<Variant | null>;
  findByBarcode(barcode: string): Promise<Variant | null>;
  findByEANCode(eanCode: string): Promise<Variant | null>;
  findByUPCCode(upcCode: string): Promise<Variant | null>;
  findMany(): Promise<Variant[]>;
  findManyByProduct(productId: UniqueEntityID): Promise<Variant[]>;
  findManyByPriceRange(minPrice: number, maxPrice: number): Promise<Variant[]>;
  findManyBelowReorderPoint(): Promise<Variant[]>;
  findManyByProductWithAggregations(productId: UniqueEntityID): Promise<
    Array<{
      variant: Variant;
      productCode: string | null;
      productName: string;
      itemCount: number;
      totalCurrentQuantity: number;
    }>
  >;
  update(data: UpdateVariantSchema): Promise<Variant | null>;
  save(variant: Variant): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
