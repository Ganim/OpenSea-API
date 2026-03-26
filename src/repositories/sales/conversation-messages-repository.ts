import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ConversationMessage } from '@/entities/sales/conversation-message';

export interface CreateConversationMessageSchema {
  conversationId: string;
  senderId?: string;
  senderName: string;
  senderType?: string;
  content: string;
}

export interface ConversationMessagesRepository {
  create(data: CreateConversationMessageSchema): Promise<ConversationMessage>;
  findByConversationId(conversationId: UniqueEntityID): Promise<ConversationMessage[]>;
  markAsRead(conversationId: UniqueEntityID): Promise<void>;
  save(message: ConversationMessage): Promise<void>;
}
