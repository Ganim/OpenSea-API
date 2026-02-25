import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailFoldersRepository } from '@/repositories/email/in-memory/in-memory-email-folders-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListEmailMessagesUseCase } from './list-email-messages';

let accountsRepository: InMemoryEmailAccountsRepository;
let foldersRepository: InMemoryEmailFoldersRepository;
let messagesRepository: InMemoryEmailMessagesRepository;
let sut: ListEmailMessagesUseCase;

describe('ListEmailMessagesUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    foldersRepository = new InMemoryEmailFoldersRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();

    sut = new ListEmailMessagesUseCase(
      accountsRepository,
      foldersRepository,
      messagesRepository,
    );

    // Create test account
    const account = await accountsRepository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'user@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: true,
      username: 'user@example.com',
      encryptedSecret: 'enc:password',
      isActive: true,
    });

    // Create test folder
    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      displayName: 'INBOX',
      remoteName: 'INBOX',
      type: 'INBOX',
      uidValidity: 123,
      lastUid: 100,
    });

    // Create test messages
    for (let i = 1; i <= 5; i++) {
      await messagesRepository.create({
        tenantId: 'tenant-1',
        accountId: account.id.toString(),
        folderId: folder.id.toString(),
        remoteUid: i,
        fromAddress: `sender${i}@example.com`,
        toAddresses: ['user@example.com'],
        subject: `Subject ${i}`,
        bodyText: `Body ${i}`,
        isRead: i % 2 === 0,
        receivedAt: new Date(),
      });
    }
  });

  it('should list messages for account', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
    });

    expect(result.messages).toHaveLength(5);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
  });

  it('should filter messages by folder', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );
    const folders = await foldersRepository.listByAccount(
      account!.id.toString(),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      folderId: folders[0].id.toString(),
    });

    expect(result.messages).toHaveLength(5);
  });

  it('should filter unread messages', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      unread: true,
    });

    expect(result.messages.every((m) => !m.isRead)).toBe(true);
  });

  it('should paginate messages', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      limit: 2,
      page: 1,
    });

    expect(result.messages).toHaveLength(2);
    expect(result.page).toBe(1);
    expect(result.pages).toBe(3);
  });

  it('should search messages by subject', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      search: 'Subject 1',
    });

    expect(result.messages.length).toBeGreaterThan(0);
  });

  it('should throw error if user does not have access', async () => {
    const otherAccount = await accountsRepository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'other-user',
      address: 'other@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: true,
      username: 'other@example.com',
      encryptedSecret: 'enc:password',
      isActive: true,
    });

    await accountsRepository.create(otherAccount);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: otherAccount.id.toString(),
      }),
    ).rejects.toThrow('You do not have access to this account');
  });
});
