import type { ChatbotConfig } from '@/entities/sales/chatbot-config';

export interface UpsertChatbotConfigSchema {
  tenantId: string;
  greeting?: string;
  autoReplyMessage?: string | null;
  assignToUserId?: string | null;
  formId?: string | null;
  primaryColor?: string;
  isActive?: boolean;
}

export interface ChatbotConfigsRepository {
  findByTenantId(tenantId: string): Promise<ChatbotConfig | null>;
  findByTenantSlug(tenantSlug: string): Promise<ChatbotConfig | null>;
  upsert(data: UpsertChatbotConfigSchema): Promise<ChatbotConfig>;
}
