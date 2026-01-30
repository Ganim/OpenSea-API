import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Slug } from '@/entities/stock/value-objects/slug';
import { Variant } from '@/entities/stock/variant';
import type { Variant as PrismaVariant } from '@prisma/generated/client.js';

export function mapVariantPrismaToDomain(variantDb: PrismaVariant) {
  // Garante que slug não é vazio
  const slug = variantDb.slug && variantDb.slug.trim()
    ? Slug.create(variantDb.slug)
    : Slug.createFromText(variantDb.name || 'variant');

  return {
    id: new UniqueEntityID(variantDb.id),
    productId: new UniqueEntityID(variantDb.productId),
    sku: variantDb.sku ?? undefined,
    slug: slug,
    fullCode: variantDb.fullCode ?? undefined,
    sequentialCode: variantDb.sequentialCode ?? undefined,
    name: variantDb.name,
    price: Number(variantDb.price.toString()),
    imageUrl: variantDb.imageUrl ?? undefined,
    attributes: variantDb.attributes as Record<string, unknown>,
    costPrice: variantDb.costPrice
      ? Number(variantDb.costPrice.toString())
      : undefined,
    profitMargin: variantDb.profitMargin
      ? Number(variantDb.profitMargin.toString())
      : undefined,
    barcode: variantDb.barcode ?? undefined,
    qrCode: variantDb.qrCode ?? undefined,
    eanCode: variantDb.eanCode ?? undefined,
    upcCode: variantDb.upcCode ?? undefined,
    colorHex: variantDb.colorHex ?? undefined,
    colorPantone: variantDb.colorPantone ?? undefined,
    minStock: variantDb.minStock
      ? Number(variantDb.minStock.toString())
      : undefined,
    maxStock: variantDb.maxStock
      ? Number(variantDb.maxStock.toString())
      : undefined,
    reorderPoint: variantDb.reorderPoint
      ? Number(variantDb.reorderPoint.toString())
      : undefined,
    reorderQuantity: variantDb.reorderQuantity
      ? Number(variantDb.reorderQuantity.toString())
      : undefined,
    reference: variantDb.reference ?? undefined,
    similars: (variantDb.similars as unknown[]) ?? undefined,
    outOfLine: variantDb.outOfLine,
    isActive: variantDb.isActive,
    createdAt: variantDb.createdAt,
    updatedAt: variantDb.updatedAt,
    deletedAt: variantDb.deletedAt ?? undefined,
  };
}

export function variantPrismaToDomain(variantDb: PrismaVariant): Variant {
  return Variant.create(
    mapVariantPrismaToDomain(variantDb),
    new UniqueEntityID(variantDb.id),
  );
}
