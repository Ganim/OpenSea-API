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
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  attributes?: Record<string, unknown>;
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
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  attributes?: Record<string, unknown>;
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
  update(data: UpdateVariantSchema): Promise<Variant | null>;
  save(variant: Variant): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
