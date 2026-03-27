import type { Conversation } from '@/entities/sales/conversation';
import type { ConversationMessageDTO } from './conversation-message-to-dto';

export interface ConversationDTO {
  id: string;
  customerId: string;
  subject: string;
  status: string;
  lastMessageAt?: Date;
  createdBy: string;
  overallSentiment?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  messages?: ConversationMessageDTO[];
}

export function conversationToDTO(
  conversation: Conversation,
  messages?: ConversationMessageDTO[],
): ConversationDTO {
  const dto: ConversationDTO = {
    id: conversation.id.toString(),
    customerId: conversation.customerId.toString(),
    subject: conversation.subject,
    status: conversation.status,
    createdBy: conversation.createdBy,
    isActive: conversation.isActive,
    createdAt: conversation.createdAt,
  };

  if (conversation.lastMessageAt)
    dto.lastMessageAt = conversation.lastMessageAt;
  if (conversation.overallSentiment)
    dto.overallSentiment = conversation.overallSentiment;
  if (conversation.updatedAt) dto.updatedAt = conversation.updatedAt;
  if (messages) dto.messages = messages;

  return dto;
}
