import type { ConversationMessage } from '@/entities/sales/conversation-message';

export interface ConversationMessageDTO {
  id: string;
  conversationId: string;
  senderId?: string;
  senderName: string;
  senderType: string;
  content: string;
  readAt?: Date;
  createdAt: Date;
}

export function conversationMessageToDTO(
  message: ConversationMessage,
): ConversationMessageDTO {
  const dto: ConversationMessageDTO = {
    id: message.id.toString(),
    conversationId: message.conversationId.toString(),
    senderName: message.senderName,
    senderType: message.senderType,
    content: message.content,
    createdAt: message.createdAt,
  };

  if (message.senderId) dto.senderId = message.senderId;
  if (message.readAt) dto.readAt = message.readAt;

  return dto;
}
