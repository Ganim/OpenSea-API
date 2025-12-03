import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Product } from '@/entities/stock/product';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import type { Product as PrismaProduct } from '@prisma/client';

export function mapProductPrismaToDomain(productDb: PrismaProduct) {
  return {
    id: new UniqueEntityID(productDb.id),
    name: productDb.name,
    code: productDb.code ?? undefined,
    fullCode: productDb.fullCode ?? undefined,
    sequentialCode: productDb.sequentialCode ?? undefined,
    description: productDb.description ?? undefined,
    status: ProductStatus.create(productDb.status),
    attributes: productDb.attributes as Record<string, unknown>,
    templateId: new UniqueEntityID(productDb.templateId),
    supplierId: productDb.supplierId
      ? new UniqueEntityID(productDb.supplierId)
      : undefined,
    manufacturerId: productDb.manufacturerId
      ? new UniqueEntityID(productDb.manufacturerId)
      : undefined,
    createdAt: productDb.createdAt,
    updatedAt: productDb.updatedAt,
    deletedAt: productDb.deletedAt ?? undefined,
  };
}

export function productPrismaToDomain(productDb: PrismaProduct): Product {
  return Product.create(
    mapProductPrismaToDomain(productDb),
    new UniqueEntityID(productDb.id),
  );
}
