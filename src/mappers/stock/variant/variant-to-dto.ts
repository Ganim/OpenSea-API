import type { Variant } from '@/entities/stock/variant';
import type { VariantProductInfo } from '@/repositories/stock/variants-repository';

export interface VariantDTO {
  id: string;
  productId: string;
  sku?: string;
  fullCode?: string;
  sequentialCode?: number;
  name: string;
  price: number;
  attributes: Record<string, unknown>;
  costPrice?: number;
  profitMargin?: number;
  barcode?: string;
  qrCode?: string;
  eanCode?: string;
  upcCode?: string;
  colorHex?: string;
  colorPantone?: string;
  secondaryColorHex?: string;
  secondaryColorPantone?: string;
  pattern?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  reference?: string;
  similars?: unknown[];
  outOfLine: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface VariantWithAggregationsDTO extends VariantDTO {
  productCode: string | null;
  productName: string;
  itemCount: number;
  totalCurrentQuantity: number;
}

export interface VariantProductInfoDTO {
  productId: string;
  productName: string;
  templateId: string | null;
  templateName: string | null;
  manufacturerId: string | null;
  manufacturerName: string | null;
}

export interface VariantWithProductDTO extends VariantDTO {
  product?: VariantProductInfoDTO;
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
    attributes: variant.attributes,
    costPrice: variant.costPrice,
    profitMargin: variant.profitMargin,
    barcode: variant.barcode,
    qrCode: variant.qrCode,
    eanCode: variant.eanCode,
    upcCode: variant.upcCode,
    colorHex: variant.colorHex,
    colorPantone: variant.colorPantone,
    secondaryColorHex: variant.secondaryColorHex,
    secondaryColorPantone: variant.secondaryColorPantone,
    pattern: variant.pattern,
    minStock: variant.minStock,
    maxStock: variant.maxStock,
    reorderPoint: variant.reorderPoint,
    reorderQuantity: variant.reorderQuantity,
    reference: variant.reference,
    similars: variant.similars,
    outOfLine: variant.outOfLine,
    isActive: variant.isActive,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
    deletedAt: variant.deletedAt,
  };
}

export function variantWithAggregationsToDTO(variantWithAggregations: {
  variant: Variant;
  productCode: string | null;
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

export function variantProductInfoToDTO(
  info: VariantProductInfo,
): VariantProductInfoDTO {
  return {
    productId: info.productId,
    productName: info.productName,
    templateId: info.templateId,
    templateName: info.templateName,
    manufacturerId: info.manufacturerId,
    manufacturerName: info.manufacturerName,
  };
}

export function variantWithProductToDTO(
  variant: Variant,
  info: VariantProductInfo | undefined,
): VariantWithProductDTO {
  return {
    ...variantToDTO(variant),
    product: info ? variantProductInfoToDTO(info) : undefined,
  };
}
