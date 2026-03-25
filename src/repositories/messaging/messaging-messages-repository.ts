import type { MessagingMessage } from '@/entities/messaging/messaging-message';

export interface ListMessagesParams {
  page: number;
  limit: number;
}

export interface ListMessagesResult {
  messages: MessagingMessage[];
  total: number;
}

export interface MessagingMessagesRepository {
  findById(id: string): Promise<MessagingMessage | null>;
  findByContactId(
    contactId: string,
    params: ListMessagesParams,
  ): Promise<ListMessagesResult>;
  findByExternalId(externalId: string): Promise<MessagingMessage | null>;
  create(message: MessagingMessage): Promise<void>;
  save(message: MessagingMessage): Promise<void>;
}
