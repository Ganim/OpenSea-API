import type { ChatbotConfig } from '@/entities/sales/chatbot-config';

export interface ChatbotConfigDTO {
  id: string;
  tenantId: string;
  greeting: string;
  autoReplyMessage?: string;
  assignToUserId?: string;
  formId?: string;
  primaryColor: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export function chatbotConfigToDTO(config: ChatbotConfig): ChatbotConfigDTO {
  const dto: ChatbotConfigDTO = {
    id: config.id.toString(),
    tenantId: config.tenantId.toString(),
    greeting: config.greeting,
    primaryColor: config.primaryColor,
    isActive: config.isActive,
    createdAt: config.createdAt,
  };

  if (config.autoReplyMessage) dto.autoReplyMessage = config.autoReplyMessage;
  if (config.assignToUserId) dto.assignToUserId = config.assignToUserId;
  if (config.formId) dto.formId = config.formId;
  if (config.updatedAt) dto.updatedAt = config.updatedAt;

  return dto;
}

export interface ChatbotPublicConfigDTO {
  greeting: string;
  primaryColor: string;
}

export function chatbotConfigToPublicDTO(
  config: ChatbotConfig,
): ChatbotPublicConfigDTO {
  return {
    greeting: config.greeting,
    primaryColor: config.primaryColor,
  };
}
