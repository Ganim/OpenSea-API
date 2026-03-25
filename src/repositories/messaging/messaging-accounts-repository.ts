import type { MessagingAccount } from '@/entities/messaging/messaging-account';

export interface MessagingAccountsRepository {
  findById(id: string): Promise<MessagingAccount | null>;
  findByTenantAndChannel(
    tenantId: string,
    channel: string,
  ): Promise<MessagingAccount[]>;
  findByTenantId(tenantId: string): Promise<MessagingAccount[]>;
  create(account: MessagingAccount): Promise<void>;
  save(account: MessagingAccount): Promise<void>;
  delete(id: string): Promise<void>;
}
