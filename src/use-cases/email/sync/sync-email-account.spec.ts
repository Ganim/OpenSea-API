import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailFoldersRepository } from '@/repositories/email/in-memory/in-memory-email-folders-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncEmailAccountUseCase } from './sync-email-account';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

let mockClient: {
  connect: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  getMailboxLock: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
  fetch: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

vi.mock('imapflow', () => ({
  ImapFlow: vi.fn(() => mockClient),
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

describe('SyncEmailAccountUseCase', () => {
  let accountsRepository: InMemoryEmailAccountsRepository;
  let foldersRepository: InMemoryEmailFoldersRepository;
  let messagesRepository: InMemoryEmailMessagesRepository;
  let sut: SyncEmailAccountUseCase;

  beforeEach(() => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    foldersRepository = new InMemoryEmailFoldersRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();

    mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      list: vi.fn(),
      getMailboxLock: vi.fn().mockResolvedValue({ release: vi.fn() }),
      status: vi.fn().mockResolvedValue({ uidValidity: 10, uidNext: 2 }),
      fetch: vi.fn(),
    };

    sut = new SyncEmailAccountUseCase(
      accountsRepository,
      foldersRepository,
      messagesRepository,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new FakeCipherService() as any,
    );
  });

  it('should sync folders and messages for active account', async () => {
    const account = await accountsRepository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'user@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'user@example.com',
      encryptedSecret: 'secret',
      isActive: true,
    });

    mockClient.list.mockResolvedValue([
      { path: 'INBOX', name: 'Inbox', specialUse: '\\Inbox' },
    ]);

    mockClient.fetch.mockImplementation(() =>
      createAsyncIterable([
        {
          uid: 1,
          envelope: {
            from: [{ address: 'from@example.com', name: 'From' }],
            to: [{ address: 'to@example.com' }],
            subject: 'Hello',
            messageId: '<hello@local>',
            date: new Date(),
          },
          flags: [],
          internalDate: new Date(),
          bodyStructure: null,
        },
      ]),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      accountId: account.id.toString(),
    });

    expect(result.syncedFolders).toBe(1);
    expect(result.syncedMessages).toBe(1);

    const folders = await foldersRepository.listByAccount(
      account.id.toString(),
    );

    expect(folders).toHaveLength(1);
    expect(folders[0].type).toBe('INBOX');
    expect(messagesRepository.items).toHaveLength(1);

    const updatedAccount = await accountsRepository.findById(
      account.id.toString(),
      account.tenantId.toString(),
    );

    expect(updatedAccount?.lastSyncAt).not.toBeNull();
  });
});
