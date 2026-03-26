import { MessagingTemplate } from '@/entities/messaging/messaging-template';
import type { MessagingTemplateCategory } from '@/entities/messaging/messaging-template-category.enum';
import type { MessagingTemplateStatus } from '@/entities/messaging/messaging-template-status.enum';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma, Prisma } from '@/lib/prisma';
import {
  MessagingTemplateCategory as PrismaMessagingTemplateCategory,
  MessagingTemplateStatus as PrismaMessagingTemplateStatus,
} from '@prisma/generated/client.js';
import type { MessagingTemplatesRepository } from '../messaging-templates-repository';

function toDomain(raw: Record<string, unknown>): MessagingTemplate {
  return MessagingTemplate.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId as string),
      accountId: new UniqueEntityID(raw.accountId as string),
      name: raw.name as string,
      language: raw.language as string,
      category: raw.category as MessagingTemplateCategory,
      status: raw.status as MessagingTemplateStatus,
      components: raw.components as Record<string, unknown>[],
      externalId: (raw.externalId as string) ?? null,
      createdAt: raw.createdAt as Date,
      updatedAt: raw.updatedAt as Date,
    },
    new UniqueEntityID(raw.id as string),
  );
}

export class PrismaMessagingTemplatesRepository
  implements MessagingTemplatesRepository
{
  async findByAccountId(accountId: string): Promise<MessagingTemplate[]> {
    const templateRecords = await prisma.messagingTemplate.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });

    return templateRecords.map((record) =>
      toDomain(record as unknown as Record<string, unknown>),
    );
  }

  async findByAccountAndName(
    accountId: string,
    name: string,
    language: string,
  ): Promise<MessagingTemplate | null> {
    const templateRecord = await prisma.messagingTemplate.findUnique({
      where: {
        accountId_name_language: { accountId, name, language },
      },
    });

    return templateRecord
      ? toDomain(templateRecord as unknown as Record<string, unknown>)
      : null;
  }

  async create(template: MessagingTemplate): Promise<void> {
    await prisma.messagingTemplate.create({
      data: {
        id: template.id.toString(),
        tenantId: template.tenantId.toString(),
        accountId: template.accountId.toString(),
        name: template.name,
        language: template.language,
        category:
          template.category as unknown as PrismaMessagingTemplateCategory,
        status: template.status as unknown as PrismaMessagingTemplateStatus,
        components: template.components as Prisma.InputJsonValue,
        externalId: template.externalId,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    });
  }

  async save(template: MessagingTemplate): Promise<void> {
    await prisma.messagingTemplate.update({
      where: { id: template.id.toString() },
      data: {
        name: template.name,
        language: template.language,
        category:
          template.category as unknown as PrismaMessagingTemplateCategory,
        status: template.status as unknown as PrismaMessagingTemplateStatus,
        components: template.components as Prisma.InputJsonValue,
        externalId: template.externalId,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.messagingTemplate.delete({
      where: { id },
    });
  }
}
