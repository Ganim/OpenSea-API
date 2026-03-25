import type { MessagingAccount } from '@/entities/messaging/messaging-account';
import type { MessagingAccountsRepository } from '../messaging-accounts-repository';

export class InMemoryMessagingAccountsRepository
  implements MessagingAccountsRepository
{
  public items: MessagingAccount[] = [];

  async findById(id: string): Promise<MessagingAccount | null> {
    return this.items.find((account) => account.id.toString() === id) ?? null;
  }

  async findByTenantAndChannel(
    tenantId: string,
    channel: string,
  ): Promise<MessagingAccount[]> {
    return this.items.filter(
      (account) =>
        account.tenantId.toString() === tenantId && account.channel === channel,
    );
  }

  async findByTenantId(tenantId: string): Promise<MessagingAccount[]> {
    return this.items.filter(
      (account) => account.tenantId.toString() === tenantId,
    );
  }

  async create(account: MessagingAccount): Promise<void> {
    this.items.push(account);
  }

  async save(account: MessagingAccount): Promise<void> {
    const accountIndex = this.items.findIndex((existingAccount) =>
      existingAccount.id.equals(account.id),
    );

    if (accountIndex >= 0) {
      this.items[accountIndex] = account;
    }
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((account) => account.id.toString() !== id);
  }
}
