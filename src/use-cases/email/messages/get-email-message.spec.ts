import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailFoldersRepository } from '@/repositories/email/in-memory/in-memory-email-folders-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { sanitizeEmailHtml } from '@/services/email/html-sanitizer.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetEmailMessageUseCase } from './get-email-message';

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
let sut: GetEmailMessageUseCase;

describe('GetEmailMessageUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    foldersRepository = new InMemoryEmailFoldersRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();

    credentialCipherService = {
      encrypt: vi.fn().mockReturnValue('encrypted'),
      decrypt: vi.fn().mockReturnValue('decrypted-password'),
    } as unknown as CredentialCipherService;

    sut = new GetEmailMessageUseCase(
      accountsRepository,
      messagesRepository,
      foldersRepository,
      credentialCipherService,
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

    // Create test message with body already present
    await messagesRepository.create({
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
      displayName: 'INBOX',
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

  it('should not re-fetch body when body is already present', async () => {
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

    // Message already has bodyText='Test message with attachment'
    const response = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: message.id.toString(),
    });

    // Body should be returned as-is from DB — not re-downloaded from IMAP
    expect(response.message.bodyText).toBe('Test message with attachment');
    // Note: credentialCipherService.decrypt IS called once for the attachment
    // recovery path (re-checks messages with body but no attachment records to
    // fix false-negative hasAttachments flags). The body itself is NOT re-fetched.
    expect(credentialCipherService.decrypt).toHaveBeenCalledTimes(1);
  });

  it('should attempt lazy fetch when body is null but not break on IMAP failure', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const folders = await foldersRepository.listByAccount(
      account!.id.toString(),
    );
    const folder = folders[0];

    // Create a message with no body (simulates sync without body fetch)
    const messageWithoutBody = await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: account!.id.toString(),
      folderId: folder.id.toString(),
      remoteUid: 42,
      fromAddress: 'noreply@example.com',
      toAddresses: ['user@example.com'],
      subject: 'Message without body',
      bodyText: null,
      bodyHtmlSanitized: null,
      receivedAt: new Date(),
    });

    // In test environment, ImapFlow will fail to connect - but the use case should still return
    const response = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: messageWithoutBody.id.toString(),
    });

    // Should return the message even though IMAP fetch failed
    expect(response.message).toBeDefined();
    expect(response.message.id).toBe(messageWithoutBody.id.toString());
    expect(response.message.subject).toBe('Message without body');
    // Body remains null because IMAP connection failed in test env
    expect(response.message.bodyText).toBeNull();
    expect(response.message.bodyHtmlSanitized).toBeNull();
  });

  it('should sanitize HTML body with script tags', () => {
    const maliciousHtml =
      '<p>Hello</p><script>alert("xss")</script><p>World</p>';

    const sanitized = sanitizeEmailHtml(maliciousHtml);

    // sanitizeEmailHtml should strip script tags entirely
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).toContain('<p>Hello</p>');
    expect(sanitized).toContain('<p>World</p>');
  });

  it('should sanitize HTML body with event handlers', () => {
    const htmlWithEventHandlers =
      '<p onclick="alert(1)" onmouseover="steal()">Click me</p><img src="x" onerror="alert(2)" />';

    const sanitized = sanitizeEmailHtml(htmlWithEventHandlers);

    // sanitizeEmailHtml should strip on* event handler attributes
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('onmouseover');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).toContain('Click me');
  });

  it('should sanitize HTML body with style tags', () => {
    const htmlWithStyleTag =
      '<style>body{padding:40px} p{margin:32px}</style><p>Conteúdo seguro</p>';

    const sanitized = sanitizeEmailHtml(htmlWithStyleTag);

    expect(sanitized).not.toContain('<style>');
    expect(sanitized).not.toContain('body{padding:40px}');
    expect(sanitized).toContain('Conteúdo seguro');
  });

  it('should return message with null body when folder is not found for lazy fetch', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    // Create a message pointing to a non-existent folder
    const messageWithOrphanFolder = await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: account!.id.toString(),
      folderId: 'non-existent-folder-id',
      remoteUid: 99,
      fromAddress: 'noreply@example.com',
      toAddresses: ['user@example.com'],
      subject: 'Orphan folder message',
      bodyText: null,
      bodyHtmlSanitized: null,
      receivedAt: new Date(),
    });

    const response = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: messageWithOrphanFolder.id.toString(),
    });

    // Should return gracefully, no error thrown
    expect(response.message).toBeDefined();
    expect(response.message.bodyText).toBeNull();
  });
});
