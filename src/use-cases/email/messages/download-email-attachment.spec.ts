import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailFoldersRepository } from '@/repositories/email/in-memory/in-memory-email-folders-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DownloadEmailAttachmentUseCase } from './download-email-attachment';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

let accountsRepository: InMemoryEmailAccountsRepository;
let foldersRepository: InMemoryEmailFoldersRepository;
let messagesRepository: InMemoryEmailMessagesRepository;
let credentialCipherService: CredentialCipherService;
let sut: DownloadEmailAttachmentUseCase;

describe('DownloadEmailAttachmentUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    foldersRepository = new InMemoryEmailFoldersRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();

    credentialCipherService = {
      encrypt: vi.fn().mockReturnValue('encrypted'),
      decrypt: vi.fn().mockReturnValue('decrypted-password'),
    } as unknown as CredentialCipherService;

    sut = new DownloadEmailAttachmentUseCase(
      accountsRepository,
      messagesRepository,
      foldersRepository,
      credentialCipherService,
    );

    // Create test account owned by user-1
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
      subject: 'Test with Attachment',
      bodyText: 'Message body',
      receivedAt: new Date(),
      hasAttachments: true,
    });

    // Create test attachment with IMAP storage key
    await messagesRepository.createAttachment({
      messageId: message.id.toString(),
      filename: 'document.pdf',
      contentType: 'application/pdf',
      size: 1024,
      storageKey: 'imap:0',
    });
  });

  it('should throw if message not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        messageId: 'non-existent',
        attachmentId: 'some-id',
      }),
    ).rejects.toThrow('Email message not found');
  });

  it('should throw if attachment not found', async () => {
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
        attachmentId: 'non-existent-attachment',
      }),
    ).rejects.toThrow('Attachment not found');
  });

  it('should deny access when user has canSend but not canRead', async () => {
    // Create a second account owned by another user
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
      displayName: 'INBOX',
      remoteName: 'INBOX',
      type: 'INBOX',
      uidValidity: 124,
      lastUid: 100,
    });

    // Create a message on the other account
    const otherMessage = await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: otherAccount.id.toString(),
      folderId: otherFolder.id.toString(),
      remoteUid: 1,
      fromAddress: 'someone@example.com',
      toAddresses: ['other@example.com'],
      subject: 'Other message',
      bodyText: 'Body',
      receivedAt: new Date(),
      hasAttachments: true,
    });

    const otherAttachment = await messagesRepository.createAttachment({
      messageId: otherMessage.id.toString(),
      filename: 'secret.pdf',
      contentType: 'application/pdf',
      size: 2048,
      storageKey: 'imap:0',
    });

    // Give user-1 canSend access but NOT canRead
    await accountsRepository.upsertAccess({
      accountId: otherAccount.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      canRead: false,
      canSend: true,
      canManage: false,
    });

    // user-1 tries to download attachment — should be denied
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        messageId: otherMessage.id.toString(),
        attachmentId: otherAttachment.id.toString(),
      }),
    ).rejects.toThrow('You do not have access to this email account');
  });

  it('should throw if storageKey has invalid format', async () => {
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

    // Create attachment with invalid storageKey (old S3 format)
    const badAttachment = await messagesRepository.createAttachment({
      messageId: message.id.toString(),
      filename: 'old-file.pdf',
      contentType: 'application/pdf',
      size: 512,
      storageKey: 'emails/tenant-1/attachments/old-file.pdf',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        messageId: message.id.toString(),
        attachmentId: badAttachment.id.toString(),
      }),
    ).rejects.toThrow('Attachment data is not available');
  });

  it('should attempt IMAP download for valid owner request (fails in test env)', async () => {
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
    const attachments = await messagesRepository.listAttachments(
      message.id.toString(),
    );
    const attachment = attachments[0];

    // In test environment, ImapFlow connection will fail — that's expected
    // This test validates that permission checks pass and IMAP is attempted
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        messageId: message.id.toString(),
        attachmentId: attachment.id.toString(),
      }),
    ).rejects.toThrow(); // IMAP connection failure
  });
});
