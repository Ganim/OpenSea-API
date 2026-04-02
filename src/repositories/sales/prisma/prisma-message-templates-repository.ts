import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import {
  MessageTemplate,
  type MessageChannelType,
} from '@/entities/sales/message-template';
import { prisma } from '@/lib/prisma';
import type { MessageChannel } from '@prisma/generated/client.js';
import type {
  CreateMessageTemplateSchema,
  MessageTemplatesRepository,
} from '../message-templates-repository';

function mapToDomain(data: Record<string, unknown>): MessageTemplate {
  const variablesRaw = data.variables;
  const variables = Array.isArray(variablesRaw)
    ? (variablesRaw as string[])
    : [];

  return MessageTemplate.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      name: data.name as string,
      channel: data.channel as MessageChannelType,
      subject: (data.subject as string) ?? undefined,
      body: data.body as string,
      variables,
      isActive: data.isActive as boolean,
      createdBy: data.createdBy as string,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaMessageTemplatesRepository
  implements MessageTemplatesRepository
{
  async create(data: CreateMessageTemplateSchema): Promise<MessageTemplate> {
    const variables =
      data.variables ?? MessageTemplate.extractVariables(data.body);

    const templateData = await prisma.messageTemplate.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        channel: data.channel as MessageChannel,
        subject: data.subject,
        body: data.body,
        variables,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
      },
    });

    return mapToDomain(templateData as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MessageTemplate | null> {
    const templateData = await prisma.messageTemplate.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!templateData) return null;
    return mapToDomain(templateData as unknown as Record<string, unknown>);
  }

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<MessageTemplate | null> {
    const templateData = await prisma.messageTemplate.findFirst({
      where: { name, tenantId, deletedAt: null },
    });

    if (!templateData) return null;
    return mapToDomain(templateData as unknown as Record<string, unknown>);
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MessageTemplate[]> {
    const templatesData = await prisma.messageTemplate.findMany({
      where: { tenantId, deletedAt: null },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return templatesData.map((data) =>
      mapToDomain(data as unknown as Record<string, unknown>),
    );
  }

  async countByTenant(tenantId: string): Promise<number> {
    return prisma.messageTemplate.count({
      where: { tenantId, deletedAt: null },
    });
  }

  async save(template: MessageTemplate): Promise<void> {
    await prisma.messageTemplate.update({
      where: { id: template.id.toString() },
      data: {
        name: template.name,
        channel: template.channel as MessageChannel,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        isActive: template.isActive,
        deletedAt: template.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.messageTemplate.update({
      where: { id: id.toString(), tenantId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
