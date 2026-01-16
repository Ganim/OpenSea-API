import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CareLabelInfo,
  Template,
  TemplateAttributesMap,
} from '@/entities/stock/template';
import { UnitOfMeasure } from '@/entities/stock/value-objects/unit-of-measure';
import type { Template as PrismaTemplate } from '@prisma/client';

export function mapTemplatePrismaToDomain(templateDb: PrismaTemplate) {
  return {
    id: new UniqueEntityID(templateDb.id),
    name: templateDb.name,
    iconUrl: templateDb.iconUrl ?? undefined,
    unitOfMeasure: UnitOfMeasure.create(templateDb.unitOfMeasure),
    productAttributes:
      templateDb.productAttributes as unknown as TemplateAttributesMap,
    variantAttributes:
      templateDb.variantAttributes as unknown as TemplateAttributesMap,
    itemAttributes:
      templateDb.itemAttributes as unknown as TemplateAttributesMap,
    careLabel: templateDb.careLabel as CareLabelInfo | undefined,
    sequentialCode: templateDb.sequentialCode,
    isActive: templateDb.isActive,
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
