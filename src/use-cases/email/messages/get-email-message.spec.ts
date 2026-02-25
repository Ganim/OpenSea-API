import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailFoldersRepository } from '@/repositories/email/in-memory/in-memory-email-folders-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetEmailMessageUseCase } from './get-email-message';

let accountsRepository: InMemoryEmailAccountsRepository;
let foldersRepository: InMemoryEmailFoldersRepository;
let messagesRepository: InMemoryEmailMessagesRepository;
let sut: GetEmailMessageUseCase;

describe('GetEmailMessageUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    foldersRepository = new InMemoryEmailFoldersRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();

    sut = new GetEmailMessageUseCase(accountsRepository, messagesRepository);

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

    // Create test message with attachments
    const message = await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: account.id.toString(),
      folderId: folder.id.toString(),
      remoteUid: 1,
      fromAddress: 'sender@example.com',
      toAddresses: ['user@example.com'],
      subject: 'Test with Attachment',
      bodyText: 'Test message with attachment',
      receivedAt: new Date(),
    });
  });

  it('should get message by id', async () => {
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

    const result2 = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: message.id.toString(),
    });

    expect(result2.message).toBeDefined();
    expect(result2.message.id).toBe(message.id.toString());
    expect(result2.message.fromAddress).toBe('sender@example.com');
    expect(result2.message.subject).toBe('Test with Attachment');
  });

  it('should include attachments in response', async () => {
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

    const result2 = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: message.id.toString(),
    });

    expect(result2.message.attachments).toBeDefined();
    expect(Array.isArray(result2.message.attachments)).toBe(true);
  });

  it('should throw error if message not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        messageId: 'invalid-id',
      }),
    ).rejects.toThrow('Email message not found');
  });

  it('should throw error if user does not have read permission', async () => {
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

    const otherFolder = await foldersRepository.create({
      accountId: otherAccount.id.toString(),
      name: 'INBOX',
      remoteName: 'INBOX',
      type: 'INBOX',
      uidValidity: 124,
      lastUid: 100,
    });

    const otherMessage = await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: otherAccount.id.toString(),
      folderId: otherFolder.id.toString(),
      remoteUid: 1,
      fromAddress: 'sender@example.com',
      toAddresses: ['other@example.com'],
      subject: 'Test',
      bodyText: 'Test message',
      receivedAt: new Date(),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        messageId: otherMessage.id.toString(),
      }),
    ).rejects.toThrow('You do not have access to this message');
  });
});
