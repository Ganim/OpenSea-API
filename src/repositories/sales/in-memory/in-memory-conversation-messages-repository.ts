import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ConversationMessage } from '@/entities/sales/conversation-message';
import type {
  ConversationMessagesRepository,
  CreateConversationMessageSchema,
} from '../conversation-messages-repository';

export class InMemoryConversationMessagesRepository
  implements ConversationMessagesRepository
{
  public items: ConversationMessage[] = [];

  async create(
    data: CreateConversationMessageSchema,
  ): Promise<ConversationMessage> {
    const message = ConversationMessage.create({
      conversationId: new UniqueEntityID(data.conversationId),
      senderId: data.senderId,
      senderName: data.senderName,
      senderType: data.senderType,
      content: data.content,
    });

    this.items.push(message);
    return message;
  }

  async findByConversationId(
    conversationId: UniqueEntityID,
  ): Promise<ConversationMessage[]> {
    return this.items
      .filter((item) => item.conversationId.equals(conversationId))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async markAsRead(conversationId: UniqueEntityID): Promise<void> {
    this.items
      .filter(
        (item) => item.conversationId.equals(conversationId) && !item.readAt,
      )
      .forEach((item) => item.markAsRead());
  }

  async save(message: ConversationMessage): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(message.id));

    if (index >= 0) {
      this.items[index] = message;
    } else {
      this.items.push(message);
    }
  }
}
