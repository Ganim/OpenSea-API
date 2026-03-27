import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ChatbotConfig } from '@/entities/sales/chatbot-config';
import { prisma } from '@/lib/prisma';
import type {
  ChatbotConfigsRepository,
  UpsertChatbotConfigSchema,
} from '../chatbot-configs-repository';

function mapToDomain(data: Record<string, unknown>): ChatbotConfig {
  return ChatbotConfig.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      greeting: data.greeting as string,
      autoReplyMessage: (data.autoReplyMessage as string) ?? undefined,
      assignToUserId: (data.assignToUserId as string) ?? undefined,
      formId: (data.formId as string) ?? undefined,
      primaryColor: data.primaryColor as string,
      isActive: data.isActive as boolean,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaChatbotConfigsRepository
  implements ChatbotConfigsRepository
{
  async findByTenantId(tenantId: string): Promise<ChatbotConfig | null> {
    const configData = await prisma.chatbotConfig.findUnique({
      where: { tenantId },
    });

    if (!configData) return null;
    return mapToDomain(configData as unknown as Record<string, unknown>);
  }

  async findByTenantSlug(tenantSlug: string): Promise<ChatbotConfig | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });

    if (!tenant) return null;

    return this.findByTenantId(tenant.id);
  }

  async upsert(data: UpsertChatbotConfigSchema): Promise<ChatbotConfig> {
    const configData = await prisma.chatbotConfig.upsert({
      where: { tenantId: data.tenantId },
      create: {
        tenantId: data.tenantId,
        greeting: data.greeting ?? 'Olá! Como posso ajudar?',
        autoReplyMessage: data.autoReplyMessage,
        assignToUserId: data.assignToUserId,
        formId: data.formId,
        primaryColor: data.primaryColor ?? '#6366f1',
        isActive: data.isActive ?? false,
      },
      update: {
        ...(data.greeting !== undefined && { greeting: data.greeting }),
        ...(data.autoReplyMessage !== undefined && {
          autoReplyMessage: data.autoReplyMessage,
        }),
        ...(data.assignToUserId !== undefined && {
          assignToUserId: data.assignToUserId,
        }),
        ...(data.formId !== undefined && { formId: data.formId }),
        ...(data.primaryColor !== undefined && {
          primaryColor: data.primaryColor,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return mapToDomain(configData as unknown as Record<string, unknown>);
  }
}
