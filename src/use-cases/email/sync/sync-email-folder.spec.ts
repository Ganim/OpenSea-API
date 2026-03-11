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

const TENANT_ID = new UniqueEntityID('tenant-1');
const ACCOUNT_ID = new UniqueEntityID('account-1');

function makeAccount() {
  return EmailAccount.create(
    {
      tenantId: TENANT_ID,
      ownerUserId: new UniqueEntityID('user-1'),
      address: 'user@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'user@example.com',
      encryptedSecret: 'secret',
    },
    ACCOUNT_ID,
  );
}

function makeImapMessage(overrides: {
  uid: number;
  subject?: string;
  from?: { address: string; name?: string }[];
  to?: { address: string; name?: string }[];
  cc?: { address: string; name?: string }[];
  bcc?: { address: string; name?: string }[];
  flags?: string[];
  internalDate?: Date;
  bodyStructure?: unknown;
  messageId?: string;
  inReplyTo?: string;
  envelope?: unknown;
}) {
  if ('envelope' in overrides && overrides.envelope !== undefined) {
    return {
      uid: overrides.uid,
      envelope: overrides.envelope,
      flags: overrides.flags ?? [],
      internalDate: overrides.internalDate ?? new Date('2026-01-15'),
      bodyStructure: overrides.bodyStructure ?? {
        type: 'text/plain',
        parameters: { charset: 'utf-8' },
      },
    };
  }

  return {
    uid: overrides.uid,
    envelope: {
      from: overrides.from ?? [
        { address: 'sender@example.com', name: 'Sender' },
      ],
      to: overrides.to ?? [{ address: 'recipient@example.com' }],
      cc: overrides.cc ?? [],
      bcc: overrides.bcc ?? [],
      subject: overrides.subject ?? `Test Email ${overrides.uid}`,
      messageId: overrides.messageId ?? `<msg-${overrides.uid}@example.com>`,
      date: new Date('2026-01-15'),
      inReplyTo: overrides.inReplyTo ?? null,
    },
    flags: overrides.flags ?? [],
    internalDate: overrides.internalDate ?? new Date('2026-01-15'),
    bodyStructure: overrides.bodyStructure ?? {
      type: 'text/plain',
      parameters: { charset: 'utf-8' },
    },
  };
}

function makeFakeClient(options: {
  uidValidity: number;
  uidNext: number;
  fetchMessages?: unknown[];
  snippetMessages?: unknown[];
}) {
  let fetchCallCount = 0;
  const fetchMessages = options.fetchMessages ?? [];
  const snippetMessages = options.snippetMessages ?? [];

  return {
    connect: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    getMailboxLock: vi.fn().mockResolvedValue({ release: vi.fn() }),
    status: vi.fn().mockResolvedValue({
      uidValidity: options.uidValidity,
      uidNext: options.uidNext,
    }),
    fetch: vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount === 1) {
        return createAsyncIterable(fetchMessages);
      }
      return createAsyncIterable(snippetMessages);
    }),
  } as unknown as ImapFlow;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new FakeCipherService() as any,
    );
  });

  it('should sync new messages and update folder metadata', async () => {
    const account = makeAccount();

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

  it('should skip messages that already exist in the database', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    // Pre-insert message with remoteUid=1
    await messagesRepository.create({
      tenantId: account.tenantId.toString(),
      accountId: account.id.toString(),
      folderId: folder.id.toString(),
      remoteUid: 1,
      fromAddress: 'existing@example.com',
      toAddresses: ['me@example.com'],
      subject: 'Already Synced',
      receivedAt: new Date(),
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({ uid: 1, subject: 'Already Synced' }),
        makeImapMessage({ uid: 2, subject: 'Brand New' }),
      ],
    });

    const result = await sut.execute({ account, folder, client });

    expect(result.synced).toBe(1);
    expect(result.createdMessages).toHaveLength(1);
    expect(result.createdMessages[0].subject).toBe('Brand New');
    // 1 pre-existing + 1 new
    expect(messagesRepository.items).toHaveLength(2);
  });

  it('should handle empty folder (no messages to sync)', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [],
    });

    const result = await sut.execute({ account, folder, client });

    expect(result.synced).toBe(0);
    expect(result.createdMessages).toHaveLength(0);
    expect(messagesRepository.items).toHaveLength(0);
  });

  it('should detect uidValidity change and soft-delete stale messages', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 50,
      uidValidity: 100,
    });

    // Pre-insert stale messages
    await messagesRepository.create({
      tenantId: account.tenantId.toString(),
      accountId: account.id.toString(),
      folderId: folder.id.toString(),
      remoteUid: 10,
      fromAddress: 'old@example.com',
      toAddresses: ['me@example.com'],
      subject: 'Stale 1',
      receivedAt: new Date(),
    });

    await messagesRepository.create({
      tenantId: account.tenantId.toString(),
      accountId: account.id.toString(),
      folderId: folder.id.toString(),
      remoteUid: 20,
      fromAddress: 'old@example.com',
      toAddresses: ['me@example.com'],
      subject: 'Stale 2',
      receivedAt: new Date(),
    });

    // Server reports changed uidValidity (200 != 100)
    const client = makeFakeClient({
      uidValidity: 200,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({ uid: 1, subject: 'Fresh After Reset' }),
      ],
    });

    const result = await sut.execute({ account, folder, client });

    // Stale messages should be soft-deleted
    const staleMessages = messagesRepository.items.filter(
      (m) => m.deletedAt !== null,
    );
    expect(staleMessages).toHaveLength(2);

    // New message synced after reset (lastUid reset to 0)
    expect(result.synced).toBe(1);
    expect(result.createdMessages[0].subject).toBe('Fresh After Reset');
  });

  it('should set isRead=true when message has \\Seen flag', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({ uid: 1, subject: 'Read', flags: ['\\Seen'] }),
      ],
    });

    await sut.execute({ account, folder, client });

    expect(messagesRepository.items[0].isRead).toBe(true);
  });

  it('should set isFlagged=true when message has \\Flagged flag', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({ uid: 1, subject: 'Starred', flags: ['\\Flagged'] }),
      ],
    });

    await sut.execute({ account, folder, client });

    expect(messagesRepository.items[0].isFlagged).toBe(true);
  });

  it('should set isAnswered=true when message has \\Answered flag', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({
          uid: 1,
          subject: 'Replied',
          flags: ['\\Answered'],
        }),
      ],
    });

    await sut.execute({ account, folder, client });

    expect(messagesRepository.items[0].isAnswered).toBe(true);
  });

  it('should detect attachment from disposition=attachment in bodyStructure', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({
          uid: 1,
          subject: 'With PDF',
          bodyStructure: {
            type: 'multipart/mixed',
            childNodes: [
              { type: 'text/plain', parameters: { charset: 'utf-8' } },
              {
                type: 'application/pdf',
                disposition: 'attachment',
                dispositionParameters: { filename: 'report.pdf' },
              },
            ],
          },
        }),
      ],
    });

    await sut.execute({ account, folder, client });

    expect(messagesRepository.items[0].hasAttachments).toBe(true);
  });

  it('should detect attachment from inline with filename in bodyStructure', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({
          uid: 1,
          subject: 'Inline Image',
          bodyStructure: {
            type: 'multipart/mixed',
            childNodes: [
              { type: 'text/html', parameters: { charset: 'utf-8' } },
              {
                type: 'image/png',
                disposition: 'inline',
                dispositionParameters: { filename: 'logo.png' },
              },
            ],
          },
        }),
      ],
    });

    await sut.execute({ account, folder, client });

    expect(messagesRepository.items[0].hasAttachments).toBe(true);
  });

  it('should NOT detect attachment from plain text/html bodyStructure', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({
          uid: 1,
          subject: 'Plain Text Only',
          bodyStructure: {
            type: 'text/plain',
            parameters: { charset: 'utf-8' },
          },
        }),
      ],
    });

    await sut.execute({ account, folder, client });

    expect(messagesRepository.items[0].hasAttachments).toBe(false);
  });

  it('should parse fromAddress, toAddresses, ccAddresses from envelope', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({
          uid: 1,
          subject: 'Multi-recipient',
          from: [{ address: 'boss@company.com', name: 'The Boss' }],
          to: [
            { address: 'alice@company.com', name: 'Alice' },
            { address: 'bob@company.com', name: 'Bob' },
          ],
          cc: [{ address: 'charlie@company.com', name: 'Charlie' }],
          bcc: [{ address: 'secret@company.com', name: 'Secret' }],
        }),
      ],
    });

    await sut.execute({ account, folder, client });

    const msg = messagesRepository.items[0];
    expect(msg.fromAddress).toBe('boss@company.com');
    expect(msg.fromName).toBe('The Boss');
    expect(msg.toAddresses).toEqual(['alice@company.com', 'bob@company.com']);
    expect(msg.ccAddresses).toEqual(['charlie@company.com']);
    expect(msg.bccAddresses).toEqual(['secret@company.com']);
  });

  it('should handle missing envelope fields gracefully', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    // Message with completely empty envelope object
    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [makeImapMessage({ uid: 1, envelope: {} })],
    });

    const result = await sut.execute({ account, folder, client });

    expect(result.synced).toBe(1);

    const msg = messagesRepository.items[0];
    expect(msg.fromAddress).toBe('');
    expect(msg.fromName).toBeNull();
    expect(msg.toAddresses).toEqual([]);
    expect(msg.ccAddresses).toEqual([]);
    expect(msg.bccAddresses).toEqual([]);
    expect(msg.subject).toBe('');
  });

  it('should skip messages with uid=0', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({ uid: 0, subject: 'Should Be Skipped' }),
        makeImapMessage({ uid: 1, subject: 'Should Be Synced' }),
      ],
    });

    const result = await sut.execute({ account, folder, client });

    expect(result.synced).toBe(1);
    expect(messagesRepository.items).toHaveLength(1);
    expect(messagesRepository.items[0].subject).toBe('Should Be Synced');
  });

  it('should handle uidNext indicating no new messages', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 50,
      uidValidity: 100,
    });

    // uidNext=51 means fromUid (51) >= uidNext (51), so no new messages
    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 51,
      fetchMessages: [],
    });

    const result = await sut.execute({ account, folder, client });

    expect(result.synced).toBe(0);
    expect(result.lastUid).toBe(50);
    expect(result.createdMessages).toHaveLength(0);
    // fetch should NOT be called because the use case short-circuits
    expect(client.fetch).not.toHaveBeenCalled();
  });

  it('should skip individual duplicate messages (P2002) without failing entire sync', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    // Pre-insert uid=2 so findExistingRemoteUids will find it and skip it
    await messagesRepository.create({
      tenantId: account.tenantId.toString(),
      accountId: account.id.toString(),
      folderId: folder.id.toString(),
      remoteUid: 2,
      fromAddress: 'dup@example.com',
      toAddresses: ['me@example.com'],
      subject: 'Duplicate',
      receivedAt: new Date(),
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({ uid: 1, subject: 'First' }),
        makeImapMessage({ uid: 2, subject: 'Duplicate' }),
        makeImapMessage({ uid: 3, subject: 'Third' }),
      ],
    });

    const result = await sut.execute({ account, folder, client });

    // uid=2 already existed, so only 1 and 3 are new
    expect(result.synced).toBe(2);
    expect(result.createdMessages).toHaveLength(2);
    expect(result.createdMessages.map((m) => m.subject)).toEqual(
      expect.arrayContaining(['First', 'Third']),
    );
  });

  it('should process messages in batches', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    // Create 250 messages to trigger batch processing (PROCESS_BATCH_SIZE = 200)
    const imapMessages: unknown[] = [];
    for (let i = 1; i <= 250; i++) {
      imapMessages.push(makeImapMessage({ uid: i, subject: `Message ${i}` }));
    }

    const findExistingSpy = vi.spyOn(
      messagesRepository,
      'findExistingRemoteUids',
    );

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 500,
      fetchMessages: imapMessages,
    });

    const result = await sut.execute({ account, folder, client });

    expect(result.synced).toBe(250);
    expect(messagesRepository.items).toHaveLength(250);

    // Should have been called twice: once for first batch of 200, once for remaining 50
    expect(findExistingSpy).toHaveBeenCalledTimes(2);

    const firstCallUids = findExistingSpy.mock.calls[0][2];
    expect(firstCallUids).toHaveLength(200);

    const secondCallUids = findExistingSpy.mock.calls[1][2];
    expect(secondCallUids).toHaveLength(50);
  });

  it('should detect attachment from non-text MIME part with filename in parameters', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    // Some email clients attach files without Content-Disposition, using
    // Content-Type: image/png; name="photo.png" instead
    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({
          uid: 1,
          subject: 'Image via Content-Type',
          bodyStructure: {
            type: 'multipart/mixed',
            childNodes: [
              { type: 'text/plain', parameters: { charset: 'utf-8' } },
              {
                type: 'image/png',
                parameters: { name: 'photo.png' },
              },
            ],
          },
        }),
      ],
    });

    await sut.execute({ account, folder, client });

    expect(messagesRepository.items[0].hasAttachments).toBe(true);
  });

  it('should NOT detect attachment from inline without filename', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({
          uid: 1,
          subject: 'Inline no filename',
          bodyStructure: {
            type: 'multipart/alternative',
            childNodes: [
              { type: 'text/plain', parameters: { charset: 'utf-8' } },
              {
                type: 'text/html',
                disposition: 'inline',
                // No filename — just an inline HTML part, not a downloadable attachment
              },
            ],
          },
        }),
      ],
    });

    await sut.execute({ account, folder, client });

    expect(messagesRepository.items[0].hasAttachments).toBe(false);
  });

  it('should update folder lastUid to the highest synced UID', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 5,
      uidValidity: 100,
    });

    // UIDs arrive out of order
    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 20,
      fetchMessages: [
        makeImapMessage({ uid: 6 }),
        makeImapMessage({ uid: 10 }),
        makeImapMessage({ uid: 8 }),
      ],
    });

    const result = await sut.execute({ account, folder, client });

    expect(result.synced).toBe(3);
    expect(result.lastUid).toBe(10);

    const updatedFolder = await foldersRepository.findById(
      folder.id.toString(),
      account.id.toString(),
    );
    expect(updatedFolder?.lastUid).toBe(10);
  });

  it('should handle message with no envelope at all', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        {
          uid: 1,
          // envelope is completely undefined
          flags: [],
          internalDate: new Date('2026-01-15'),
          bodyStructure: { type: 'text/plain' },
        },
      ],
    });

    const result = await sut.execute({ account, folder, client });

    expect(result.synced).toBe(1);

    const msg = messagesRepository.items[0];
    expect(msg.fromAddress).toBe('');
    expect(msg.subject).toBe('');
    expect(msg.messageId).toBeNull();
  });

  it('should handle multiple flags combined on a single message', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [
        makeImapMessage({
          uid: 1,
          subject: 'All Flags',
          flags: ['\\Seen', '\\Flagged', '\\Answered'],
        }),
      ],
    });

    await sut.execute({ account, folder, client });

    const msg = messagesRepository.items[0];
    expect(msg.isRead).toBe(true);
    expect(msg.isFlagged).toBe(true);
    expect(msg.isAnswered).toBe(true);
  });

  it('should not connect or logout when an external client is provided', async () => {
    const account = makeAccount();

    const folder = await foldersRepository.create({
      accountId: account.id.toString(),
      remoteName: 'INBOX',
      displayName: 'Inbox',
      type: 'INBOX',
      lastUid: 0,
      uidValidity: 100,
    });

    const client = makeFakeClient({
      uidValidity: 100,
      uidNext: 10,
      fetchMessages: [makeImapMessage({ uid: 1 })],
    });

    await sut.execute({ account, folder, client });

    // When client is passed externally, connect/logout should NOT be called
    expect(client.connect).not.toHaveBeenCalled();
    expect(client.logout).not.toHaveBeenCalled();
  });
});
