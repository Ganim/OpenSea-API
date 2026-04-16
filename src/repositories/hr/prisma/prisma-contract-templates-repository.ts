import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractTemplate,
  type ContractTemplateTypeValue,
} from '@/entities/hr/contract-template';
import { prisma } from '@/lib/prisma';
import { mapContractTemplatePrismaToDomain } from '@/mappers/hr/contract-template';
import type {
  ContractTemplatesRepository,
  CreateContractTemplateSchema,
  FindManyContractTemplatesParams,
  FindManyContractTemplatesResult,
  UpdateContractTemplateSchema,
} from '../contract-templates-repository';

export class PrismaContractTemplatesRepository
  implements ContractTemplatesRepository
{
  async create(
    data: CreateContractTemplateSchema,
  ): Promise<ContractTemplate> {
    const templateData = await prisma.contractTemplate.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        type: data.type,
        content: data.content,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
      },
    });

    return ContractTemplate.create(
      mapContractTemplatePrismaToDomain(templateData),
      new UniqueEntityID(templateData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ContractTemplate | null> {
    const templateData = await prisma.contractTemplate.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!templateData) return null;

    return ContractTemplate.create(
      mapContractTemplatePrismaToDomain(templateData),
      new UniqueEntityID(templateData.id),
    );
  }

  async findDefaultByType(
    type: ContractTemplateTypeValue,
    tenantId: string,
  ): Promise<ContractTemplate | null> {
    const templateData = await prisma.contractTemplate.findFirst({
      where: {
        tenantId,
        type,
        isDefault: true,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!templateData) return null;

    return ContractTemplate.create(
      mapContractTemplatePrismaToDomain(templateData),
      new UniqueEntityID(templateData.id),
    );
  }

  async findMany(
    params: FindManyContractTemplatesParams,
  ): Promise<FindManyContractTemplatesResult> {
    const { tenantId, page = 1, perPage = 20, search, type, isActive } = params;

    const where = {
      tenantId,
      deletedAt: null,
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
      ...(type && { type }),
      ...(isActive !== undefined && { isActive }),
    };

    const [templates, total] = await Promise.all([
      prisma.contractTemplate.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.contractTemplate.count({ where }),
    ]);

    return {
      templates: templates.map((tpl) =>
        ContractTemplate.create(
          mapContractTemplatePrismaToDomain(tpl),
          new UniqueEntityID(tpl.id),
        ),
      ),
      total,
    };
  }

  async update(
    data: UpdateContractTemplateSchema,
  ): Promise<ContractTemplate | null> {
    const existing = await prisma.contractTemplate.findFirst({
      where: { id: data.id.toString(), deletedAt: null },
    });

    if (!existing) return null;

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    const templateData = await prisma.contractTemplate.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return ContractTemplate.create(
      mapContractTemplatePrismaToDomain(templateData),
      new UniqueEntityID(templateData.id),
    );
  }

  async save(template: ContractTemplate): Promise<void> {
    await prisma.contractTemplate.update({
      where: { id: template.id.toString() },
      data: {
        name: template.name,
        type: template.type,
        content: template.content,
        isActive: template.isActive,
        isDefault: template.isDefault,
        deletedAt: template.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.contractTemplate.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date(), isActive: false, isDefault: false },
    });
  }
}
