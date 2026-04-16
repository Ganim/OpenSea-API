import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ContractTemplateTypeValue } from '@/entities/hr/contract-template';
import type { Prisma } from '@prisma/generated/client.js';

export function mapContractTemplatePrismaToDomain(
  templateDb: Prisma.ContractTemplateGetPayload<{ include: Record<string, never> }>,
) {
  return {
    tenantId: new UniqueEntityID(templateDb.tenantId),
    name: templateDb.name,
    type: templateDb.type as ContractTemplateTypeValue,
    content: templateDb.content,
    isActive: templateDb.isActive,
    isDefault: templateDb.isDefault,
    deletedAt: templateDb.deletedAt ?? undefined,
    createdAt: templateDb.createdAt,
    updatedAt: templateDb.updatedAt,
  };
}
