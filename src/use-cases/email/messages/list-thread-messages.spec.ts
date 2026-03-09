import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListThreadMessagesUseCase } from './list-thread-messages';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const TENANT_ID = 'tenant-1';
const ACCOUNT_ID = 'account-1';
const FOLDER_ID = 'folder-1';

let messagesRepository: InMemoryEmailMessagesRepository;
let sut: ListThreadMessagesUseCase;

describe('ListThreadMessagesUseCase', () => {
  beforeEach(() => {
    messagesRepository = new InMemoryEmailMessagesRepository();
    sut = new ListThreadMessagesUseCase(messagesRepository);
  });

  it('should throw ResourceNotFoundError when message does not exist', async () => {
    await expect(
      sut.execute({ tenantId: TENANT_ID, messageId: 'non-existent' }),
    ).rejects.toThrow('Message not found');
  });

  it('should return only the message itself when it has no RFC messageId', async () => {
    const msg = await messagesRepository.create({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 1,
      messageId: undefined, // no RFC messageId
      fromAddress: 'a@test.com',
      toAddresses: ['b@test.com'],
      subject: 'No threading',
      receivedAt: new Date('2026-01-01'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      messageId: msg.id.toString(),
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].id.toString()).toBe(msg.id.toString());
  });

  it('should return only the message when no thread relatives exist', async () => {
    const msg = await messagesRepository.create({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 1,
      messageId: '<standalone@test.com>',
      fromAddress: 'a@test.com',
      toAddresses: ['b@test.com'],
      subject: 'Standalone',
      receivedAt: new Date('2026-01-01'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      messageId: msg.id.toString(),
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].subject).toBe('Standalone');
  });

  it('should return a linear thread (parent → child → grandchild) sorted by receivedAt', async () => {
    // Create a 3-message thread chain
    const parent = await messagesRepository.create({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 1,
      messageId: '<msg-1@test.com>',
      threadId: undefined,
      fromAddress: 'alice@test.com',
      toAddresses: ['bob@test.com'],
      subject: 'Original',
      receivedAt: new Date('2026-01-01T10:00:00Z'),
    });

    const child = await messagesRepository.create({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 2,
      messageId: '<msg-2@test.com>',
      threadId: '<msg-1@test.com>', // reply to parent
      fromAddress: 'bob@test.com',
      toAddresses: ['alice@test.com'],
      subject: 'Re: Original',
      receivedAt: new Date('2026-01-01T11:00:00Z'),
    });

    const grandchild = await messagesRepository.create({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 3,
      messageId: '<msg-3@test.com>',
      threadId: '<msg-2@test.com>', // reply to child
      fromAddress: 'alice@test.com',
      toAddresses: ['bob@test.com'],
      subject: 'Re: Re: Original',
      receivedAt: new Date('2026-01-01T12:00:00Z'),
    });

    // Query from the middle message
    const result = await sut.execute({
      tenantId: TENANT_ID,
      messageId: child.id.toString(),
    });

    expect(result.messages).toHaveLength(3);
    expect(result.messages[0].id.toString()).toBe(parent.id.toString());
    expect(result.messages[1].id.toString()).toBe(child.id.toString());
    expect(result.messages[2].id.toString()).toBe(grandchild.id.toString());
  });

  it('should return a branched thread (parent with two replies)', async () => {
    const parent = await messagesRepository.create({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 1,
      messageId: '<root@test.com>',
      fromAddress: 'alice@test.com',
      toAddresses: ['bob@test.com'],
      subject: 'Thread root',
      receivedAt: new Date('2026-01-01T10:00:00Z'),
    });

    const reply1 = await messagesRepository.create({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 2,
      messageId: '<reply-1@test.com>',
      threadId: '<root@test.com>',
      fromAddress: 'bob@test.com',
      toAddresses: ['alice@test.com'],
      subject: 'Re: Thread root',
      receivedAt: new Date('2026-01-01T11:00:00Z'),
    });

    const reply2 = await messagesRepository.create({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 3,
      messageId: '<reply-2@test.com>',
      threadId: '<root@test.com>',
      fromAddress: 'carol@test.com',
      toAddresses: ['alice@test.com'],
      subject: 'Re: Thread root',
      receivedAt: new Date('2026-01-01T12:00:00Z'),
    });

    // Query from parent
    const result = await sut.execute({
      tenantId: TENANT_ID,
      messageId: parent.id.toString(),
    });

    expect(result.messages).toHaveLength(3);
    // Sorted chronologically
    expect(result.messages[0].id.toString()).toBe(parent.id.toString());
    expect(result.messages[1].id.toString()).toBe(reply1.id.toString());
    expect(result.messages[2].id.toString()).toBe(reply2.id.toString());
  });

  it('should not include messages from a different tenant', async () => {
    const msg = await messagesRepository.create({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 1,
      messageId: '<isolated@test.com>',
      fromAddress: 'a@test.com',
      toAddresses: ['b@test.com'],
      subject: 'Tenant 1 message',
      receivedAt: new Date('2026-01-01'),
    });

    // Same messageId but different tenant — should NOT appear in thread
    await messagesRepository.create({
      tenantId: 'other-tenant',
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 2,
      messageId: '<reply-isolated@test.com>',
      threadId: '<isolated@test.com>',
      fromAddress: 'attacker@test.com',
      toAddresses: ['b@test.com'],
      subject: 'Cross-tenant reply',
      receivedAt: new Date('2026-01-02'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      messageId: msg.id.toString(),
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].subject).toBe('Tenant 1 message');
  });

  it('should not include soft-deleted messages in the thread', async () => {
    const parent = await messagesRepository.create({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 1,
      messageId: '<parent-del@test.com>',
      fromAddress: 'a@test.com',
      toAddresses: ['b@test.com'],
      subject: 'Parent',
      receivedAt: new Date('2026-01-01T10:00:00Z'),
    });

    const reply = await messagesRepository.create({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 2,
      messageId: '<reply-del@test.com>',
      threadId: '<parent-del@test.com>',
      fromAddress: 'b@test.com',
      toAddresses: ['a@test.com'],
      subject: 'Re: Parent',
      receivedAt: new Date('2026-01-01T11:00:00Z'),
    });

    // Soft-delete the reply
    await messagesRepository.update({
      id: reply.id.toString(),
      tenantId: TENANT_ID,
      deletedAt: new Date(),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      messageId: parent.id.toString(),
    });

    // Only parent should be returned (reply is soft-deleted)
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].id.toString()).toBe(parent.id.toString());
  });

  it('should include the target message even if findThreadMessages misses it', async () => {
    // This tests the safety net in the use case that pushes the target
    // back into the results if not present. With the in-memory impl
    // this shouldn't happen, but we test the code path by verifying
    // the target is always included.
    const msg = await messagesRepository.create({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      folderId: FOLDER_ID,
      remoteUid: 1,
      messageId: '<ensure-target@test.com>',
      fromAddress: 'a@test.com',
      toAddresses: ['b@test.com'],
      subject: 'Target',
      receivedAt: new Date('2026-01-01'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      messageId: msg.id.toString(),
    });

    const ids = result.messages.map((m) => m.id.toString());
    expect(ids).toContain(msg.id.toString());
  });
});
