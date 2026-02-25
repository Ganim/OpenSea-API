import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmailAccount } from '@/entities/email/email-account';
import { InMemoryEmailFoldersRepository } from '@/repositories/email/in-memory/in-memory-email-folders-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import type { ImapFlow } from 'imapflow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncEmailFolderUseCase } from './sync-email-folder';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

class FakeCipherService {
  decrypt(value: string) {
    return value;
  }
}

function createAsyncIterable<T>(items: T[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of items) {
        yield item;
      }
    },
  } as AsyncIterable<T>;
}

describe('SyncEmailFolderUseCase', () => {
  let foldersRepository: InMemoryEmailFoldersRepository;
  let messagesRepository: InMemoryEmailMessagesRepository;
  let sut: SyncEmailFolderUseCase;

  beforeEach(() => {
    foldersRepository = new InMemoryEmailFoldersRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();
    sut = new SyncEmailFolderUseCase(
      foldersRepository,
      messagesRepository,
      new FakeCipherService() as any,
    );
  });

  it('should sync new messages and update folder metadata', async () => {
    const account = EmailAccount.create({
      tenantId: new UniqueEntityID('tenant-1'),
      ownerUserId: new UniqueEntityID('user-1'),
      address: 'user@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'user@example.com',
      encryptedSecret: 'secret',
    });

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 1,
      uidValidity: 10,
    });

    await messagesRepository.create({
      tenantId: account.tenantId.toString(),
      accountId: account.id.toString(),
      folderId: folder.id.toString(),
      remoteUid: 2,
      fromAddress: 'from@example.com',
      toAddresses: ['to@example.com'],
      subject: 'Existing',
      receivedAt: new Date(),
    });

    const client = {
      getMailboxLock: vi.fn().mockResolvedValue({ release: vi.fn() }),
      status: vi.fn().mockResolvedValue({ uidValidity: 12, uidNext: 4 }),
      fetch: vi.fn().mockReturnValue(
        createAsyncIterable([
          {
            uid: 2,
            envelope: {
              from: [{ address: 'from@example.com', name: 'From' }],
              to: [{ address: 'to@example.com' }],
              subject: 'Existing',
              messageId: '<existing@local>',
              date: new Date(),
            },
            flags: ['\\Seen'],
            internalDate: new Date(),
            bodyStructure: { disposition: { type: 'attachment' } },
          },
          {
            uid: 3,
            envelope: {
              from: [{ address: 'from@example.com', name: 'From' }],
              to: [{ address: 'to@example.com' }],
              subject: 'New',
              messageId: '<new@local>',
              date: new Date(),
            },
            flags: [],
            internalDate: new Date(),
            bodyStructure: null,
          },
        ]),
      ),
    } as unknown as ImapFlow;

    const result = await sut.execute({ account, folder, client });

    expect(result.synced).toBe(1);
    expect(result.lastUid).toBe(3);
    expect(messagesRepository.items).toHaveLength(2);

    const updatedFolder = await foldersRepository.findById(
      folder.id.toString(),
      account.id.toString(),
    );

    expect(updatedFolder?.lastUid).toBe(3);
    expect(updatedFolder?.uidValidity).toBe(12);
  });
});
