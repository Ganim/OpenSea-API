import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/email/notification-suppressor.service', () => ({
  getNotificationSuppressor: () => ({
    suppress: vi.fn().mockResolvedValue(undefined),
    isActive: vi.fn().mockResolvedValue(false),
  }),
}));

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

const mockImapClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  append: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  usable: true,
};

vi.mock('@/services/email/imap-connection-pool', () => ({
  getImapConnectionPool: () => ({
    acquire: vi.fn().mockResolvedValue(mockImapClient),
    release: vi.fn(),
    destroy: vi.fn(),
  }),
}));

import { SendEmailMessageUseCase } from './send-email-message';

class FakeCipherService {
  decrypt(value: string) {
    return value.replace('enc:', '');
  }
}

class FakeSmtpClientService {
  send = vi.fn().mockResolvedValue('message-id-123');
}

class FakeEmailFoldersRepository {
  listByAccount = vi.fn().mockResolvedValue([]);
}

let accountsRepository: InMemoryEmailAccountsRepository;
let messagesRepository: InMemoryEmailMessagesRepository;
let foldersRepository: FakeEmailFoldersRepository;
let sut: SendEmailMessageUseCase;

describe('SendEmailMessageUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();
    foldersRepository = new FakeEmailFoldersRepository();

    sut = new SendEmailMessageUseCase(
      accountsRepository,

      foldersRepository as any,
      messagesRepository,

      new FakeCipherService() as any,

      new FakeSmtpClientService() as any,
    );

    await accountsRepository.create({
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
      displayName: 'Test User',
      signature: 'Best regards',
      isActive: true,
    });
  });

  it('should send email message successfully', async () => {
    const smtpService = new FakeSmtpClientService();
    sut = new SendEmailMessageUseCase(
      accountsRepository,

      foldersRepository as any,
      messagesRepository,

      new FakeCipherService() as any,

      smtpService as any,
    );

    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      to: ['recipient@example.com'],
      subject: 'Test Subject',
      bodyHtml: '<p>Test body</p>',
    });

    expect(result.messageId).toBe('message-id-123');
    expect(smtpService.send).toHaveBeenCalledOnce();
  });

  it('should throw error if account not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: 'invalid-id',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        bodyHtml: '<p>Test body</p>',
      }),
    ).rejects.toThrow('Email account not found');
  });

  it('should send bodyHtml as-is (signature is added by frontend)', async () => {
    const smtpService = new FakeSmtpClientService();
    sut = new SendEmailMessageUseCase(
      accountsRepository,

      foldersRepository as any,
      messagesRepository,

      new FakeCipherService() as any,

      smtpService as any,
    );

    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      to: ['recipient@example.com'],
      subject: 'With Signature',
      bodyHtml: '<p>Hello</p><hr/><p>Best regards</p>',
    });

    expect(smtpService.send).toHaveBeenCalledOnce();
    const sendCall = smtpService.send.mock.calls[0];
    const mailOptions = sendCall[1];
    // Backend should pass bodyHtml through without modification
    expect(mailOptions.html).toBe('<p>Hello</p><hr/><p>Best regards</p>');
  });

  it('should send with inReplyTo and references headers', async () => {
    const smtpService = new FakeSmtpClientService();
    sut = new SendEmailMessageUseCase(
      accountsRepository,

      foldersRepository as any,
      messagesRepository,

      new FakeCipherService() as any,

      smtpService as any,
    );

    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      to: ['recipient@example.com'],
      subject: 'Re: Original',
      bodyHtml: '<p>Reply</p>',
      inReplyTo: '<original-msg-id@example.com>',
      references: [
        '<original-msg-id@example.com>',
        '<earlier-msg-id@example.com>',
      ],
    });

    expect(smtpService.send).toHaveBeenCalledOnce();
    const sendCall = smtpService.send.mock.calls[0];
    const mailOptions = sendCall[1];
    expect(mailOptions.inReplyTo).toBe('<original-msg-id@example.com>');
    expect(mailOptions.references).toEqual([
      '<original-msg-id@example.com>',
      '<earlier-msg-id@example.com>',
    ]);
  });

  it('should handle inactive account', async () => {
    // Create an inactive account
    const inactiveAccount = await accountsRepository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'inactive@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: true,
      username: 'inactive@example.com',
      encryptedSecret: 'enc:password',
      isActive: false,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: inactiveAccount.id.toString(),
        to: ['recipient@example.com'],
        subject: 'Test',
        bodyHtml: '<p>Test</p>',
      }),
    ).rejects.toThrow('Email account is not active');
  });

  it('should mark original message as answered when replying', async () => {
    const smtpService = new FakeSmtpClientService();
    sut = new SendEmailMessageUseCase(
      accountsRepository,

      foldersRepository as any,
      messagesRepository,

      new FakeCipherService() as any,

      smtpService as any,
    );

    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    // Create the original message in the repository
    const originalMessage = await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: account!.id.toString(),
      folderId: 'folder-1',
      remoteUid: 1,
      messageId: '<original-msg-id@example.com>',
      fromAddress: 'sender@example.com',
      toAddresses: ['user@example.com'],
      subject: 'Original Subject',
      receivedAt: new Date(),
      isAnswered: false,
    });

    expect(originalMessage.isAnswered).toBe(false);

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      to: ['sender@example.com'],
      subject: 'Re: Original Subject',
      bodyHtml: '<p>Reply</p>',
      inReplyTo: '<original-msg-id@example.com>',
    });

    const updated = await messagesRepository.findByRfcMessageId(
      account!.id.toString(),
      '<original-msg-id@example.com>',
    );

    expect(updated!.isAnswered).toBe(true);
  });
});
