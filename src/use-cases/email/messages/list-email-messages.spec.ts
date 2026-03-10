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

  it('should include isFlagged in list DTO', async () => {
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
    for (const msg of result.messages) {
      expect(msg).toHaveProperty('isFlagged');
      expect(typeof msg.isFlagged).toBe('boolean');
    }
  });

  it('should filter flagged messages', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    // Flag one message
    const allMessages = await messagesRepository.list({
      tenantId: 'tenant-1',
      accountId: account!.id.toString(),
      page: 1,
      limit: 100,
    });
    const firstMsg = allMessages.messages[0];
    await messagesRepository.update({
      id: firstMsg.id.toString(),
      tenantId: 'tenant-1',
      isFlagged: true,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      flagged: true,
    });

    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.messages.every((m) => m.isFlagged)).toBe(true);
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

  it('should paginate with cursor and return nextCursor', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    // First page with cursor (no cursor = first page)
    // Use limit=2 so we get a nextCursor
    const firstPage = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      limit: 2,
      cursor: undefined,
    });

    // Without cursor, nextCursor should be undefined (offset mode)
    expect(firstPage.messages).toHaveLength(2);
    expect(firstPage.nextCursor).toBeUndefined();
  });

  it('should use cursor to fetch subsequent pages', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    // Create messages with distinct receivedAt timestamps
    messagesRepository.items.length = 0; // clear
    const folders = await foldersRepository.listByAccount(account!.id.toString());
    const folderId = folders[0].id.toString();

    for (let i = 0; i < 5; i++) {
      await messagesRepository.create({
        tenantId: 'tenant-1',
        accountId: account!.id.toString(),
        folderId,
        remoteUid: 100 + i,
        fromAddress: `sender${i}@example.com`,
        toAddresses: ['user@example.com'],
        subject: `Cursor Test ${i}`,
        receivedAt: new Date(Date.now() - i * 60000), // each 1 min apart
      });
    }

    // Build a cursor from the 2nd message (index 1 = second most recent)
    const sorted = [...messagesRepository.items].sort(
      (a, b) => b.receivedAt.getTime() - a.receivedAt.getTime(),
    );
    const secondMsg = sorted[1];
    const cursor = Buffer.from(
      JSON.stringify({ r: secondMsg.receivedAt.toISOString(), i: secondMsg.id.toString() }),
    ).toString('base64');

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      limit: 2,
      cursor,
    });

    // Should get messages after the 2nd one (i.e., 3rd and 4th most recent)
    expect(result.messages).toHaveLength(2);
    expect(result.nextCursor).toBeTruthy(); // still 1 more message left
    expect(result.total).toBe(5); // total always reflects full count
  });

  it('should return null nextCursor on last page when using cursor', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    messagesRepository.items.length = 0;
    const folders = await foldersRepository.listByAccount(account!.id.toString());
    const folderId = folders[0].id.toString();

    for (let i = 0; i < 3; i++) {
      await messagesRepository.create({
        tenantId: 'tenant-1',
        accountId: account!.id.toString(),
        folderId,
        remoteUid: 200 + i,
        fromAddress: `sender${i}@example.com`,
        toAddresses: ['user@example.com'],
        subject: `Last Page ${i}`,
        receivedAt: new Date(Date.now() - i * 60000),
      });
    }

    const sorted = [...messagesRepository.items].sort(
      (a, b) => b.receivedAt.getTime() - a.receivedAt.getTime(),
    );
    // Cursor at 1st item, so next page starts from 2nd
    const cursor = Buffer.from(
      JSON.stringify({ r: sorted[0].receivedAt.toISOString(), i: sorted[0].id.toString() }),
    ).toString('base64');

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      limit: 10, // larger than remaining items
      cursor,
    });

    expect(result.messages).toHaveLength(2); // 2 items after the first
    expect(result.nextCursor).toBeNull(); // no more pages
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

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: otherAccount.id.toString(),
      }),
    ).rejects.toThrow('You do not have access to this account');
  });
});
