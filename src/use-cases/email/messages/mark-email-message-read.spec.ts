import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailFoldersRepository } from '@/repositories/email/in-memory/in-memory-email-folders-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('imapflow', () => {
  const FakeImapFlow = class {
    connect = vi.fn().mockResolvedValue(undefined);
    getMailboxLock = vi.fn().mockResolvedValue({
      release: vi.fn().mockResolvedValue(undefined),
    });
    messageFlagsAdd = vi.fn().mockResolvedValue(undefined);
    messageFlagsRemove = vi.fn().mockResolvedValue(undefined);
    logout = vi.fn().mockResolvedValue(undefined);
  };

  return { ImapFlow: FakeImapFlow };
});

import { MarkEmailMessageReadUseCase } from './mark-email-message-read';

class FakeCipherService {
  decrypt(value: string) {
    return value.replace('enc:', '');
  }
}

let accountsRepository: InMemoryEmailAccountsRepository;
let foldersRepository: InMemoryEmailFoldersRepository;
let messagesRepository: InMemoryEmailMessagesRepository;
let sut: MarkEmailMessageReadUseCase;
let cipherService: FakeCipherService;

describe('MarkEmailMessageReadUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    foldersRepository = new InMemoryEmailFoldersRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();
    cipherService = new FakeCipherService();

    sut = new MarkEmailMessageReadUseCase(
      accountsRepository,
      foldersRepository,
      messagesRepository,
      cipherService as any,
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

    // Create test message
    const message = await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: account.id.toString(),
      folderId: folder.id.toString(),
      remoteUid: 1,
      fromAddress: 'sender@example.com',
      toAddresses: ['user@example.com'],
      subject: 'Test',
      bodyText: 'Test message',
      isRead: false,
      receivedAt: new Date(),
    });
  });

  it('should mark message as read', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );
    const result = await messagesRepository.list({
      tenantId: 'tenant-1',
      accountId: account!.id.toString(),
      limit: 1,
    });
    const message = result.messages[0];

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: message.id.toString(),
      isRead: true,
    });

    const updated = await messagesRepository.findById(
      message.id.toString(),
      'tenant-1',
    );
    expect(updated!.isRead).toBe(true);
  });

  it('should mark message as unread', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );
    const result = await messagesRepository.list({
      tenantId: 'tenant-1',
      accountId: account!.id.toString(),
      limit: 1,
    });
    const message = result.messages[0];

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: message.id.toString(),
      isRead: false,
    });

    const updated = await messagesRepository.findById(
      message.id.toString(),
      'tenant-1',
    );
    expect(updated!.isRead).toBe(false);
  });

  it('should throw error if message not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        messageId: 'invalid-id',
        isRead: true,
      }),
    ).rejects.toThrow('Email message not found');
  });

  it('should throw error if user does not have read permission', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );
    const result = await messagesRepository.list({
      tenantId: 'tenant-1',
      accountId: account!.id.toString(),
      limit: 1,
    });
    const message = result.messages[0];

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'other-user',
        messageId: message.id.toString(),
        isRead: true,
      }),
    ).rejects.toThrow('You do not have access to this message');
  });
});
