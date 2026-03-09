import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmailAccount } from '@/entities/email/email-account';
import type {
  CreateEmailAccountSchema,
  EmailAccountAccessItem,
  EmailAccountsRepository,
  UpdateEmailAccountSchema,
  UpsertEmailAccountAccessSchema,
} from '../email-accounts-repository';

export class InMemoryEmailAccountsRepository
  implements EmailAccountsRepository
{
  public items: EmailAccount[] = [];
  public accesses: EmailAccountAccessItem[] = [];

  async create(data: CreateEmailAccountSchema): Promise<EmailAccount> {
    const account = EmailAccount.create({
      tenantId: new UniqueEntityID(data.tenantId),
      ownerUserId: new UniqueEntityID(data.ownerUserId),
      address: data.address,
      displayName: data.displayName ?? null,
      imapHost: data.imapHost,
      imapPort: data.imapPort,
      imapSecure: data.imapSecure ?? true,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpSecure: data.smtpSecure ?? true,
      tlsVerify: data.tlsVerify ?? false,
      username: data.username,
      encryptedSecret: data.encryptedSecret,
      visibility: data.visibility ?? 'PRIVATE',
      isActive: data.isActive ?? true,
      isDefault: data.isDefault ?? false,
      signature: data.signature ?? null,
    });

    this.items.push(account);
    return account;
  }

  async findById(id: string, tenantId: string): Promise<EmailAccount | null> {
    return (
      this.items.find(
        (item) =>
          item.id.toString() === id && item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyByIds(ids: string[], tenantId: string): Promise<EmailAccount[]> {
    const idSet = new Set(ids);
    return this.items.filter(
      (item) =>
        idSet.has(item.id.toString()) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findByAddress(
    address: string,
    tenantId: string,
  ): Promise<EmailAccount | null> {
    return (
      this.items.find(
        (item) =>
          item.address === address && item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async listVisibleByUser(
    tenantId: string,
    userId: string,
  ): Promise<EmailAccount[]> {
    return this.items.filter((item) => {
      if (item.tenantId.toString() !== tenantId) return false;
      if (item.ownerUserId.toString() === userId) return true;
      return this.accesses.some(
        (access) =>
          access.accountId === item.id.toString() && access.userId === userId,
      );
    });
  }

  async listOwnedByUser(
    tenantId: string,
    ownerUserId: string,
  ): Promise<EmailAccount[]> {
    return this.items.filter(
      (item) =>
        item.tenantId.toString() === tenantId &&
        item.ownerUserId.toString() === ownerUserId,
    );
  }

  async listActive(tenantId?: string): Promise<EmailAccount[]> {
    return this.items.filter((item) => {
      if (!item.isActive) return false;
      if (tenantId && item.tenantId.toString() !== tenantId) return false;
      return true;
    });
  }

  async update(data: UpdateEmailAccountSchema): Promise<EmailAccount | null> {
    const account = this.items.find(
      (item) =>
        item.id.toString() === data.id &&
        item.tenantId.toString() === data.tenantId,
    );

    if (!account) return null;

    if (data.displayName !== undefined) account.displayName = data.displayName;
    if (data.imapHost !== undefined) account.imapHost = data.imapHost;
    if (data.imapPort !== undefined) account.imapPort = data.imapPort;
    if (data.imapSecure !== undefined) account.imapSecure = data.imapSecure;
    if (data.smtpHost !== undefined) account.smtpHost = data.smtpHost;
    if (data.smtpPort !== undefined) account.smtpPort = data.smtpPort;
    if (data.smtpSecure !== undefined) account.smtpSecure = data.smtpSecure;
    if (data.tlsVerify !== undefined) account.tlsVerify = data.tlsVerify;
    if (data.username !== undefined) account.username = data.username;
    if (data.encryptedSecret !== undefined)
      account.encryptedSecret = data.encryptedSecret;
    if (data.visibility !== undefined) account.visibility = data.visibility;
    if (data.isActive !== undefined) account.isActive = data.isActive;
    if (data.isDefault !== undefined) account.isDefault = data.isDefault;
    if (data.signature !== undefined) account.signature = data.signature;
    if (data.lastSyncAt !== undefined) account.lastSyncAt = data.lastSyncAt;

    return account;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    this.items = this.items.filter(
      (item) =>
        !(item.id.toString() === id && item.tenantId.toString() === tenantId),
    );
  }

  async unsetDefaultAccounts(
    tenantId: string,
    ownerUserId: string,
  ): Promise<void> {
    this.items.forEach((item) => {
      if (
        item.tenantId.toString() === tenantId &&
        item.ownerUserId.toString() === ownerUserId
      ) {
        item.isDefault = false;
      }
    });
  }

  async upsertAccess(
    data: UpsertEmailAccountAccessSchema,
  ): Promise<EmailAccountAccessItem> {
    const existingIndex = this.accesses.findIndex(
      (access) =>
        access.accountId === data.accountId && access.userId === data.userId,
    );

    if (existingIndex >= 0) {
      const existing = this.accesses[existingIndex];
      const updated = {
        ...existing,
        canRead: data.canRead ?? existing.canRead,
        canSend: data.canSend ?? existing.canSend,
        canManage: data.canManage ?? existing.canManage,
      };
      this.accesses[existingIndex] = updated;
      return updated;
    }

    const created: EmailAccountAccessItem = {
      id: new UniqueEntityID().toString(),
      accountId: data.accountId,
      tenantId: data.tenantId,
      userId: data.userId,
      canRead: data.canRead ?? true,
      canSend: data.canSend ?? false,
      canManage: data.canManage ?? false,
      createdAt: new Date(),
    };

    this.accesses.push(created);
    return created;
  }

  async deleteAccess(
    accountId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    this.accesses = this.accesses.filter(
      (access) =>
        !(
          access.accountId === accountId &&
          access.userId === userId &&
          access.tenantId === tenantId
        ),
    );
  }

  async listAccess(
    accountId: string,
    tenantId: string,
  ): Promise<EmailAccountAccessItem[]> {
    return this.accesses.filter(
      (access) =>
        access.accountId === accountId && access.tenantId === tenantId,
    );
  }

  async findAccess(
    accountId: string,
    userId: string,
  ): Promise<EmailAccountAccessItem | null> {
    return (
      this.accesses.find(
        (access) => access.accountId === accountId && access.userId === userId,
      ) ?? null
    );
  }

  async findAccessByAccountIds(
    accountIds: string[],
    userId: string,
  ): Promise<EmailAccountAccessItem[]> {
    const idSet = new Set(accountIds);
    return this.accesses.filter(
      (access) => idSet.has(access.accountId) && access.userId === userId,
    );
  }
}
