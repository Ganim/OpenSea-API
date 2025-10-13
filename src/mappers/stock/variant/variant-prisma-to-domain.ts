import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Variant } from '@/entities/stock/variant';
import type { Variant as PrismaVariant } from '@prisma/client';

export function mapVariantPrismaToDomain(variantDb: PrismaVariant) {
  return {
    id: new UniqueEntityID(variantDb.id),
    productId: new UniqueEntityID(variantDb.productId),
    sku: variantDb.sku,
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
