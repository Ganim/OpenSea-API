import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetEmailAttachmentDownloadUrlUseCase } from './get-email-attachment-download-url';

let accountsRepository: InMemoryEmailAccountsRepository;
let messagesRepository: InMemoryEmailMessagesRepository;
let fileUploadService: FileUploadService;
let sut: GetEmailAttachmentDownloadUrlUseCase;

describe('GetEmailAttachmentDownloadUrlUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();

    fileUploadService = {
      getPresignedUrl: vi
        .fn()
        .mockResolvedValue('https://s3.example.com/presigned-url'),
    } as unknown as FileUploadService;

    sut = new GetEmailAttachmentDownloadUrlUseCase(
      accountsRepository,
      messagesRepository,
      fileUploadService,
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

    // Create test message
    const message = await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: account.id.toString(),
      folderId: 'folder-1',
      remoteUid: 1,
      fromAddress: 'sender@example.com',
      toAddresses: ['user@example.com'],
      subject: 'Test with Attachment',
      bodyText: 'Message body',
      receivedAt: new Date(),
      hasAttachments: true,
    });

    // Create test attachment
    await messagesRepository.createAttachment({
      messageId: message.id.toString(),
      filename: 'document.pdf',
      contentType: 'application/pdf',
      size: 1024,
      storageKey: 'emails/tenant-1/attachments/document.pdf',
    });
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

    // Create a message on the other account
    const otherMessage = await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: otherAccount.id.toString(),
      folderId: 'folder-2',
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
      storageKey: 'emails/tenant-1/attachments/secret.pdf',
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
});
