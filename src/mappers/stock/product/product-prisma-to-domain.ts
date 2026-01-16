import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Product } from '@/entities/stock/product';
import { CareInstructions } from '@/entities/stock/value-objects/care-instructions';
import { ProductStatus } from '@/entities/stock/value-objects/product-status';
import type { Product as PrismaProduct } from '@prisma/client';
import { templatePrismaToDomain } from '../template/template-prisma-to-domain';
import { supplierPrismaToDomain } from '../supplier/supplier-prisma-to-domain';
import { manufacturerPrismaToDomain } from '../manufacturer/manufacturer-prisma-to-domain';
import { variantPrismaToDomain } from '../variant/variant-prisma-to-domain';
import { categoryPrismaToDomain } from '../category/category-prisma-to-domain';
import { tagPrismaToDomain } from '../tag/tag-prisma-to-domain';

type ProductWithRelations = PrismaProduct & {
  template?: any;
  supplier?: any;
  manufacturer?: any;
  organization?: any;
  variants?: any[];
  productCategories?: Array<{ category: any }>;
  productTags?: Array<{ tag: any }>;
};

export function mapProductPrismaToDomain(productDb: ProductWithRelations) {
  return {
    id: new UniqueEntityID(productDb.id),
    name: productDb.name,
    code: productDb.code ?? undefined,
    fullCode: productDb.fullCode ?? undefined,
    sequentialCode: productDb.sequentialCode ?? undefined,
    description: productDb.description ?? undefined,
    status: ProductStatus.create(productDb.status),
    attributes: productDb.attributes as Record<string, unknown>,
    careInstructions: CareInstructions.create(productDb.careInstructionIds ?? []),
    templateId: new UniqueEntityID(productDb.templateId),
    template: productDb.template ? templatePrismaToDomain(productDb.template) : undefined,
    supplierId: productDb.supplierId
      ? new UniqueEntityID(productDb.supplierId)
      : undefined,
    supplier: productDb.supplier ? supplierPrismaToDomain(productDb.supplier) : undefined,
    manufacturerId: productDb.manufacturerId
      ? new UniqueEntityID(productDb.manufacturerId)
      : undefined,
    manufacturer: productDb.manufacturer ? manufacturerPrismaToDomain(productDb.manufacturer) : undefined,
    organizationId: productDb.organizationId
      ? new UniqueEntityID(productDb.organizationId)
      : undefined,
    organization: productDb.organization ?? undefined,
    variants: productDb.variants ? productDb.variants.map(variantPrismaToDomain) : undefined,
    productCategories: productDb.productCategories 
      ? productDb.productCategories.map((pc: any) => ({
          category: categoryPrismaToDomain(pc.category),
        }))
      : undefined,
    productTags: productDb.productTags
      ? productDb.productTags.map((pt: any) => ({
          tag: tagPrismaToDomain(pt.tag),
        }))
      : undefined,
    createdAt: productDb.createdAt,
    updatedAt: productDb.updatedAt ?? undefined,
    deletedAt: productDb.deletedAt ?? undefined,
  };
}

export function productPrismaToDomain(
  productDb: ProductWithRelations,
): Product {
  return Product.create(
    mapProductPrismaToDomain(productDb),
    new UniqueEntityID(productDb.id),
  );
}
