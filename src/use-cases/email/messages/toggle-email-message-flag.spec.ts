import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailFoldersRepository } from '@/repositories/email/in-memory/in-memory-email-folders-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockImapClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  getMailboxLock: vi.fn().mockResolvedValue({
    release: vi.fn().mockResolvedValue(undefined),
  }),
  messageFlagsAdd: vi.fn().mockResolvedValue(undefined),
  messageFlagsRemove: vi.fn().mockResolvedValue(undefined),
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

import { ToggleEmailMessageFlagUseCase } from './toggle-email-message-flag';

class FakeCipherService {
  decrypt(value: string) {
    return value.replace('enc:', '');
  }
}

let accountsRepository: InMemoryEmailAccountsRepository;
let foldersRepository: InMemoryEmailFoldersRepository;
let messagesRepository: InMemoryEmailMessagesRepository;
let sut: ToggleEmailMessageFlagUseCase;

describe('ToggleEmailMessageFlagUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    foldersRepository = new InMemoryEmailFoldersRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();
    const cipherService = new FakeCipherService();

    sut = new ToggleEmailMessageFlagUseCase(
      accountsRepository,
      foldersRepository,
      messagesRepository,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cipherService as any,
    );

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

    await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: account.id.toString(),
      folderId: folder.id.toString(),
      remoteUid: 1,
      fromAddress: 'sender@example.com',
      toAddresses: ['user@example.com'],
      subject: 'Test',
      bodyText: 'Test message',
      isFlagged: false,
      receivedAt: new Date(),
    });
  });

  it('should flag a message', async () => {
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
      isFlagged: true,
    });

    const updated = await messagesRepository.findById(
      message.id.toString(),
      'tenant-1',
    );
    expect(updated!.isFlagged).toBe(true);
  });

  it('should unflag a message', async () => {
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

    // Flag first
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: message.id.toString(),
      isFlagged: true,
    });
    // Then unflag
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      messageId: message.id.toString(),
      isFlagged: false,
    });

    const updated = await messagesRepository.findById(
      message.id.toString(),
      'tenant-1',
    );
    expect(updated!.isFlagged).toBe(false);
  });

  it('should throw error if message not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        messageId: 'invalid-id',
        isFlagged: true,
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
        isFlagged: true,
      }),
    ).rejects.toThrow('You do not have access to this message');
  });
});
