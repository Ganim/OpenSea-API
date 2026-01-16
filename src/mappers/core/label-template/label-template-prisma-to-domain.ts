import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LabelTemplate } from '@/entities/core/label-template';
import type { LabelTemplate as PrismaLabelTemplate } from '@prisma/client';

export function mapLabelTemplatePrismaToDomain(
  labelTemplateDb: PrismaLabelTemplate,
) {
  return {
    id: new UniqueEntityID(labelTemplateDb.id),
    name: labelTemplateDb.name,
    description: labelTemplateDb.description ?? undefined,
    isSystem: labelTemplateDb.isSystem,
    width: labelTemplateDb.width,
    height: labelTemplateDb.height,
    grapesJsData: labelTemplateDb.grapesJsData,
    compiledHtml: labelTemplateDb.compiledHtml ?? undefined,
    compiledCss: labelTemplateDb.compiledCss ?? undefined,
    thumbnailUrl: labelTemplateDb.thumbnailUrl ?? undefined,
    organizationId: new UniqueEntityID(labelTemplateDb.organizationId),
    createdById: new UniqueEntityID(labelTemplateDb.createdById),
    createdAt: labelTemplateDb.createdAt,
    updatedAt: labelTemplateDb.updatedAt,
    deletedAt: labelTemplateDb.deletedAt ?? undefined,
  };
}

export function labelTemplatePrismaToDomain(
  labelTemplateDb: PrismaLabelTemplate,
): LabelTemplate {
  return LabelTemplate.create(
    mapLabelTemplatePrismaToDomain(labelTemplateDb),
    new UniqueEntityID(labelTemplateDb.id),
  );
}
