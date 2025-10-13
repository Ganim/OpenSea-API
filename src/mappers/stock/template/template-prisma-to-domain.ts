import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Template } from '@/entities/stock/template';
import type { Template as PrismaTemplate } from '@prisma/client';

export function mapTemplatePrismaToDomain(templateDb: PrismaTemplate) {
  return {
    id: new UniqueEntityID(templateDb.id),
    name: templateDb.name,
    productAttributes: templateDb.productAttributes as Record<string, unknown>,
    variantAttributes: templateDb.variantAttributes as Record<string, unknown>,
    itemAttributes: templateDb.itemAttributes as Record<string, unknown>,
    createdAt: templateDb.createdAt,
    updatedAt: templateDb.updatedAt,
    deletedAt: templateDb.deletedAt ?? undefined,
  };
}

export function templatePrismaToDomain(templateDb: PrismaTemplate): Template {
  return Template.create(
    mapTemplatePrismaToDomain(templateDb),
    new UniqueEntityID(templateDb.id),
  );
}
