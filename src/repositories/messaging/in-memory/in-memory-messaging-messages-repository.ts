import type { MessagingMessage } from '@/entities/messaging/messaging-message';
import type {
  ListMessagesParams,
  ListMessagesResult,
  MessagingMessagesRepository,
} from '../messaging-messages-repository';

export class InMemoryMessagingMessagesRepository
  implements MessagingMessagesRepository
{
  public items: MessagingMessage[] = [];

  async findById(id: string): Promise<MessagingMessage | null> {
    return this.items.find((message) => message.id.toString() === id) ?? null;
  }

  async findByContactId(
    contactId: string,
    params: ListMessagesParams,
  ): Promise<ListMessagesResult> {
    const contactMessages = this.items
      .filter((message) => message.contactId.toString() === contactId)
      .sort(
        (messageA, messageB) =>
          messageB.createdAt.getTime() - messageA.createdAt.getTime(),
      );

    const total = contactMessages.length;
    const offset = (params.page - 1) * params.limit;
    const paginatedMessages = contactMessages.slice(
      offset,
      offset + params.limit,
    );

    return { messages: paginatedMessages, total };
  }

  async findByExternalId(externalId: string): Promise<MessagingMessage | null> {
    return (
      this.items.find((message) => message.externalId === externalId) ?? null
    );
  }

  async create(message: MessagingMessage): Promise<void> {
    this.items.push(message);
  }

  async save(message: MessagingMessage): Promise<void> {
    const messageIndex = this.items.findIndex((existingMessage) =>
      existingMessage.id.equals(message.id),
    );

    if (messageIndex >= 0) {
      this.items[messageIndex] = message;
    }
  }
}
