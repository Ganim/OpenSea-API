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
    messageMove = vi.fn().mockResolvedValue(undefined);
    mailboxClose = vi.fn().mockResolvedValue(undefined);
    expunge = vi.fn().mockResolvedValue(undefined);
    logout = vi.fn().mockResolvedValue(undefined);
  };

  return { ImapFlow: FakeImapFlow };
});

import { DeleteEmailMessageUseCase } from './delete-email-message';

class FakeCipherService {
  decrypt(value: string) {
    return value.replace('enc:', '');
  }
}

let accountsRepository: InMemoryEmailAccountsRepository;
let foldersRepository: InMemoryEmailFoldersRepository;
let messagesRepository: InMemoryEmailMessagesRepository;
let sut: DeleteEmailMessageUseCase;

describe('DeleteEmailMessageUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    foldersRepository = new InMemoryEmailFoldersRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();

    sut = new DeleteEmailMessageUseCase(
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

    // Create INBOX folder
    const inboxFolder = await foldersRepository.create({
      accountId: account.id.toString(),
      displayName: 'INBOX',
      remoteName: 'INBOX',
      type: 'INBOX',
      uidValidity: 123,
      lastUid: 100,
    });

    // Create TRASH folder
    await foldersRepository.create({
      accountId: account.id.toString(),
      displayName: 'Trash',
      remoteName: '[Gmail]/Trash',
      type: 'TRASH',
      uidValidity: 124,
      lastUid: 50,
    });

    // Create test message in INBOX
    await messagesRepository.create({
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

  it('should move message to trash when deleting from inbox', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );
    const messagesList = await messagesRepository.list({
      tenantId: 'tenant-1',
      accountId: account!.id.toString(),
      limit: 1,
    });
    const message = messagesList.messages[0];

    const trashFolder = await foldersRepository.findByType(
      account!.id.toString(),
      'TRASH',
    );

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: message.id.toString(),
    });

    // Message should still exist (not soft-deleted)
    const movedMessage = await messagesRepository.findById(
      message.id.toString(),
      'tenant-1',
    );
    expect(movedMessage).not.toBeNull();
    // Message should now be in the Trash folder
    expect(movedMessage!.folderId.toString()).toBe(trashFolder!.id.toString());
    expect(movedMessage!.deletedAt).toBeNull();
  });

  it('should permanently delete message when already in trash', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const trashFolder = await foldersRepository.findByType(
      account!.id.toString(),
      'TRASH',
    );

    // Create a message directly in the Trash folder
    const trashMessage = await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: account!.id.toString(),
      folderId: trashFolder!.id.toString(),
      remoteUid: 2,
      fromAddress: 'sender@example.com',
      toAddresses: ['user@example.com'],
      subject: 'Already in trash',
      bodyText: 'This message is already in trash',
      receivedAt: new Date(),
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: trashMessage.id.toString(),
    });

    // After permanent deletion, findById should return null (deletedAt is set)
    const deletedMessage = await messagesRepository.findById(
      trashMessage.id.toString(),
      'tenant-1',
    );
    expect(deletedMessage).toBeNull();
  });

  it('should fall back to soft-delete when trash folder does not exist', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    // Remove the Trash folder to simulate it not existing
    const trashFolder = await foldersRepository.findByType(
      account!.id.toString(),
      'TRASH',
    );
    await foldersRepository.delete(
      trashFolder!.id.toString(),
      account!.id.toString(),
    );

    const messagesList = await messagesRepository.list({
      tenantId: 'tenant-1',
      accountId: account!.id.toString(),
      limit: 1,
    });
    const message = messagesList.messages[0];

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: message.id.toString(),
    });

    // Should have been soft-deleted (findById returns null because deletedAt is set)
    const deletedMessage = await messagesRepository.findById(
      message.id.toString(),
      'tenant-1',
    );
    expect(deletedMessage).toBeNull();
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

  it('should throw error if user does not have manage permission', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );
    const messagesList = await messagesRepository.list({
      tenantId: 'tenant-1',
      accountId: account!.id.toString(),
      limit: 1,
    });
    const message = messagesList.messages[0];

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'other-user',
        messageId: message.id.toString(),
      }),
    ).rejects.toThrow('You do not have access to delete messages');
  });
});
