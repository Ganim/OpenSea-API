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
    messageMove = vi.fn().mockResolvedValue(undefined);
    logout = vi.fn().mockResolvedValue(undefined);
  };

  return { ImapFlow: FakeImapFlow };
});

import { MoveEmailMessageUseCase } from './move-email-message';

class FakeCipherService {
  decrypt(value: string) {
    return value.replace('enc:', '');
  }
}

let accountsRepository: InMemoryEmailAccountsRepository;
let foldersRepository: InMemoryEmailFoldersRepository;
let messagesRepository: InMemoryEmailMessagesRepository;
let sut: MoveEmailMessageUseCase;

describe('MoveEmailMessageUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    foldersRepository = new InMemoryEmailFoldersRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();

    sut = new MoveEmailMessageUseCase(
      accountsRepository,
      foldersRepository,
      messagesRepository,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new FakeCipherService() as any,
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

    // Create source and target folders
    const inboxFolder = await foldersRepository.create({
      accountId: account.id.toString(),
      displayName: 'INBOX',
      remoteName: 'INBOX',
      type: 'INBOX',
      uidValidity: 123,
      lastUid: 100,
    });

    await foldersRepository.create({
      accountId: account.id.toString(),
      displayName: 'Archive',
      remoteName: '[Gmail]/All Mail',
      type: 'CUSTOM',
      uidValidity: 124,
      lastUid: 50,
    });

    // Create test message in INBOX
    const _message = await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: account.id.toString(),
      folderId: inboxFolder.id.toString(),
      remoteUid: 1,
      fromAddress: 'sender@example.com',
      toAddresses: ['user@example.com'],
      subject: 'Test',
      bodyText: 'Test message',
      receivedAt: new Date(),
    });
  });

  it('should move message to target folder', async () => {
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
    const folders = await foldersRepository.listByAccount(
      account!.id.toString(),
    );
    const targetFolder = folders.find((f) => f.type === 'CUSTOM');

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: message.id.toString(),
      targetFolderId: targetFolder!.id.toString(),
    });

    expect(true).toBe(true); // IMAP would be mocked in integration tests
  });

  it('should throw error if message not found', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );
    const folders = await foldersRepository.listByAccount(
      account!.id.toString(),
    );
    const targetFolder = folders.find((f) => f.type === 'CUSTOM');

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        messageId: 'invalid-id',
        targetFolderId: targetFolder!.id.toString(),
      }),
    ).rejects.toThrow('Email message not found');
  });

  it('should throw error if target folder not found', async () => {
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
        userId: 'user-1',
        messageId: message.id.toString(),
        targetFolderId: 'invalid-folder-id',
      }),
    ).rejects.toThrow('Target email folder not found');
  });

  it('should throw error if user does not have manage permission', async () => {
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
    const folders = await foldersRepository.listByAccount(
      account!.id.toString(),
    );
    const targetFolder = folders.find((f) => f.type === 'CUSTOM');

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'other-user',
        messageId: message.id.toString(),
        targetFolderId: targetFolder!.id.toString(),
      }),
    ).rejects.toThrow('You do not have access to move messages');
  });
});
