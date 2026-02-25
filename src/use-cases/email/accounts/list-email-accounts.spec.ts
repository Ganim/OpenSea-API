import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListEmailAccountsUseCase } from './list-email-accounts';

let repository: InMemoryEmailAccountsRepository;
let sut: ListEmailAccountsUseCase;

describe('ListEmailAccountsUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryEmailAccountsRepository();
    sut = new ListEmailAccountsUseCase(repository);
  });

  it('should list accounts owned by the user', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'user1@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'user1@example.com',
      encryptedSecret: 'secret',
      isActive: true,
    });

    await repository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-2',
      address: 'user2@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'user2@example.com',
      encryptedSecret: 'secret',
      isActive: true,
    });

    const { accounts } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(accounts).toHaveLength(1);
    expect(accounts[0].address).toBe('user1@example.com');
  });

  it('should include accounts shared with the user', async () => {
    const owned = await repository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'owned@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'owned@example.com',
      encryptedSecret: 'secret',
      isActive: true,
    });

    const shared = await repository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-2',
      address: 'shared@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'shared@example.com',
      encryptedSecret: 'secret',
      isActive: true,
    });

    // Compartilhar conta com user-1
    await repository.upsertAccess({
      accountId: shared.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      canRead: true,
      canSend: false,
      canManage: false,
    });

    const { accounts } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(accounts).toHaveLength(2);
    const addresses = accounts.map((a) => a.address);
    expect(addresses).toContain('owned@example.com');
    expect(addresses).toContain('shared@example.com');
  });

  it('should return empty list when user has no accounts', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-2',
      address: 'other@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'other@example.com',
      encryptedSecret: 'secret',
      isActive: true,
    });

    const { accounts } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(accounts).toHaveLength(0);
  });

  it('should not return accounts from a different tenant', async () => {
    await repository.create({
      tenantId: 'tenant-2',
      ownerUserId: 'user-1',
      address: 'other-tenant@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'other-tenant@example.com',
      encryptedSecret: 'secret',
      isActive: true,
    });

    const { accounts } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(accounts).toHaveLength(0);
  });
});
