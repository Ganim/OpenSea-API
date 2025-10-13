import type { Variant } from '@/entities/stock/variant';

export interface VariantDTO {
  id: string;
  productId: string;
  sku: string;
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
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function variantToDTO(variant: Variant): VariantDTO {
  return {
    id: variant.id.toString(),
    productId: variant.productId.toString(),
    sku: variant.sku,
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
    minStock: variant.minStock,
    maxStock: variant.maxStock,
    reorderPoint: variant.reorderPoint,
    reorderQuantity: variant.reorderQuantity,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
    deletedAt: variant.deletedAt,
  };
}
