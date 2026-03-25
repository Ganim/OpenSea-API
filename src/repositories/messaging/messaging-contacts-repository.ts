import type { MessagingContact } from '@/entities/messaging/messaging-contact';

export interface ListContactsParams {
  page: number;
  limit: number;
  channel?: string;
  search?: string;
}

export interface ListContactsResult {
  contacts: MessagingContact[];
  total: number;
}

export interface MessagingContactsRepository {
  findById(id: string): Promise<MessagingContact | null>;
  findByAccountAndExternalId(
    accountId: string,
    externalId: string,
  ): Promise<MessagingContact | null>;
  findByTenantId(
    tenantId: string,
    params: ListContactsParams,
  ): Promise<ListContactsResult>;
  create(contact: MessagingContact): Promise<void>;
  save(contact: MessagingContact): Promise<void>;
}
