import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ChatbotConfig } from '@/entities/sales/chatbot-config';
import type {
  ChatbotConfigsRepository,
  UpsertChatbotConfigSchema,
} from '../chatbot-configs-repository';

export class InMemoryChatbotConfigsRepository
  implements ChatbotConfigsRepository
{
  public items: ChatbotConfig[] = [];
  public tenantSlugs: Map<string, string> = new Map();

  async findByTenantId(tenantId: string): Promise<ChatbotConfig | null> {
    const config = this.items.find(
      (item) => item.tenantId.toString() === tenantId,
    );
    return config ?? null;
  }

  async findByTenantSlug(tenantSlug: string): Promise<ChatbotConfig | null> {
    const tenantId = this.tenantSlugs.get(tenantSlug);
    if (!tenantId) return null;

    return this.findByTenantId(tenantId);
  }

  async upsert(data: UpsertChatbotConfigSchema): Promise<ChatbotConfig> {
    const existingIndex = this.items.findIndex(
      (item) => item.tenantId.toString() === data.tenantId,
    );

    if (existingIndex >= 0) {
      const existing = this.items[existingIndex];
      if (data.greeting !== undefined) existing.greeting = data.greeting;
      if (data.autoReplyMessage !== undefined)
        existing.autoReplyMessage = data.autoReplyMessage ?? undefined;
      if (data.assignToUserId !== undefined)
        existing.assignToUserId = data.assignToUserId ?? undefined;
      if (data.formId !== undefined) existing.formId = data.formId ?? undefined;
      if (data.primaryColor !== undefined)
        existing.primaryColor = data.primaryColor;
      if (data.isActive !== undefined) existing.isActive = data.isActive;
      this.items[existingIndex] = existing;
      return existing;
    }

    const config = ChatbotConfig.create({
      tenantId: new UniqueEntityID(data.tenantId),
      greeting: data.greeting,
      autoReplyMessage: data.autoReplyMessage ?? undefined,
      assignToUserId: data.assignToUserId ?? undefined,
      formId: data.formId ?? undefined,
      primaryColor: data.primaryColor,
      isActive: data.isActive,
    });

    this.items.push(config);
    return config;
  }
}
