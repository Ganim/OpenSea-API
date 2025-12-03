import type { Variant } from '@/entities/stock/variant';

export interface VariantDTO {
  id: string;
  productId: string;
  sku?: string;
  fullCode?: string;
  sequentialCode?: number;
  name: string;
  price: number;
  imageUrl?: string;
  attributes: Record<string, unknown>;
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
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface VariantWithAggregationsDTO extends VariantDTO {
  productCode: string;
  productName: string;
  itemCount: number;
  totalCurrentQuantity: number;
}

export function variantToDTO(variant: Variant): VariantDTO {
  return {
    id: variant.id.toString(),
    productId: variant.productId.toString(),
    sku: variant.sku,
    fullCode: variant.fullCode,
    sequentialCode: variant.sequentialCode,
    name: variant.name,
    price: variant.price,
    imageUrl: variant.imageUrl,
    attributes: variant.attributes,
    costPrice: variant.costPrice,
    profitMargin: variant.profitMargin,
    barcode: variant.barcode,
    qrCode: variant.qrCode,
    eanCode: variant.eanCode,
    upcCode: variant.upcCode,
    colorHex: variant.colorHex,
    colorPantone: variant.colorPantone,
    minStock: variant.minStock,
    maxStock: variant.maxStock,
    reorderPoint: variant.reorderPoint,
    reorderQuantity: variant.reorderQuantity,
    isActive: variant.isActive,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
    deletedAt: variant.deletedAt,
  };
}

export function variantWithAggregationsToDTO(variantWithAggregations: {
  variant: Variant;
  productCode: string;
  productName: string;
  itemCount: number;
  totalCurrentQuantity: number;
}): VariantWithAggregationsDTO {
  return {
    ...variantToDTO(variantWithAggregations.variant),
    productCode: variantWithAggregations.productCode,
    productName: variantWithAggregations.productName,
    itemCount: variantWithAggregations.itemCount,
    totalCurrentQuantity: variantWithAggregations.totalCurrentQuantity,
  };
}
