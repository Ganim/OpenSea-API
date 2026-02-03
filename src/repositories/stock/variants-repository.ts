import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Variant } from '@/entities/stock/variant';
import type { Slug } from '@/entities/stock/value-objects/slug';

export interface CreateVariantSchema {
  tenantId: string;
  productId: UniqueEntityID;
  slug: Slug; // Slug gerado automaticamente do nome - IMUTAVEL
  fullCode: string; // Código hierárquico gerado: TEMPLATE.FABRICANTE.PRODUTO.VARIANTE
  sequentialCode: number; // Sequencial local ao produto
  sku?: string;
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
  findById(id: UniqueEntityID, tenantId: string): Promise<Variant | null>;
  findBySKU(sku: string, tenantId: string): Promise<Variant | null>;
  findByBarcode(barcode: string, tenantId: string): Promise<Variant | null>;
  findByEANCode(eanCode: string, tenantId: string): Promise<Variant | null>;
  findByUPCCode(upcCode: string, tenantId: string): Promise<Variant | null>;
  findMany(tenantId: string): Promise<Variant[]>;
  findManyByProduct(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<Variant[]>;
  findManyByPriceRange(
    minPrice: number,
    maxPrice: number,
    tenantId: string,
  ): Promise<Variant[]>;
  findManyBelowReorderPoint(tenantId: string): Promise<Variant[]>;
  findManyByProductWithAggregations(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<
    Array<{
      variant: Variant;
      productCode: string | null;
      productName: string;
      itemCount: number;
      totalCurrentQuantity: number;
    }>
  >;
  findLastByProductId(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<Variant | null>;
  update(data: UpdateVariantSchema): Promise<Variant | null>;
  save(variant: Variant): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
