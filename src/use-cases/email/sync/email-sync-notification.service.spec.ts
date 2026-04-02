vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/email/notification-suppressor.service', () => ({
  getNotificationSuppressor: vi.fn(() => ({
    isSuppressed: vi.fn().mockResolvedValue(false),
  })),
}));

vi.mock(
  '@/use-cases/notifications/factories/make-create-from-template-use-case',
  () => ({
    makeCreateFromTemplateUseCase: vi.fn(() => ({
      execute: vi.fn().mockResolvedValue(undefined),
    })),
  }),
);

import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { getNotificationSuppressor } from '@/services/email/notification-suppressor.service';
import { makeCreateFromTemplateUseCase } from '@/use-cases/notifications/factories/make-create-from-template-use-case';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailSyncNotificationServiceImpl } from './email-sync-notification.service';
import type { CreatedMessageRef } from './sync-email-folder';

const tenantId = 'tenant-1';
const accountId = 'account-1';
const ownerUserId = 'user-1';

function makeMessages(count: number): CreatedMessageRef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i + 1}`,
    remoteUid: i + 1,
    receivedAt: new Date(),
    fromName: `Sender ${i + 1}`,
    fromAddress: `sender${i + 1}@test.com`,
    subject: `Subject ${i + 1}`,
  }));
}

describe('EmailSyncNotificationServiceImpl', () => {
  let emailAccountsRepository: InMemoryEmailAccountsRepository;
  let sut: EmailSyncNotificationServiceImpl;
  let mockExecute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    emailAccountsRepository = new InMemoryEmailAccountsRepository();
    sut = new EmailSyncNotificationServiceImpl(emailAccountsRepository);

    mockExecute = vi.fn().mockResolvedValue(undefined);
    vi.mocked(makeCreateFromTemplateUseCase).mockReturnValue({
      execute: mockExecute,
    });

    // Reset suppressor to default (not suppressed)
    vi.mocked(getNotificationSuppressor).mockReturnValue({
      isSuppressed: vi.fn().mockResolvedValue(false),
    });
  });

  it('should send per-email notifications when message count <= 5', async () => {
    const messages = makeMessages(3);

    await sut.notifyNewMessages({
      tenantId,
      accountId,
      accountAddress: 'test@example.com',
      ownerUserId,
      syncedMessages: 3,
      messages,
    });

    // 3 messages x 1 recipient (owner) = 3 calls
    expect(mockExecute).toHaveBeenCalledTimes(3);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        templateCode: 'email.new_message',
      }),
    );
  });

  it('should send batch notification when message count > 5', async () => {
    const messages = makeMessages(8);

    await sut.notifyNewMessages({
      tenantId,
      accountId,
      accountAddress: 'test@example.com',
      ownerUserId,
      syncedMessages: 8,
      messages,
    });

    // 1 batch notification for owner
    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        templateCode: 'email.new_messages_batch',
      }),
    );
  });

  it('should not notify when all messages are suppressed', async () => {
    vi.mocked(getNotificationSuppressor).mockReturnValue({
      isSuppressed: vi.fn().mockResolvedValue(true),
    });

    const messages = makeMessages(2);

    await sut.notifyNewMessages({
      tenantId,
      accountId,
      accountAddress: 'test@example.com',
      ownerUserId,
      syncedMessages: 2,
      messages,
    });

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should notify shared users with canRead access', async () => {
    const account = await emailAccountsRepository.create({
      tenantId,
      ownerUserId,
      address: 'shared@test.com',
      imapHost: 'imap.test.com',
      imapPort: 993,
      smtpHost: 'smtp.test.com',
      smtpPort: 465,
      username: 'shared@test.com',
      encryptedSecret: 'enc',
    });

    await emailAccountsRepository.upsertAccess({
      accountId: account.id.toString(),
      tenantId,
      userId: 'shared-user',
      canRead: true,
    });

    const messages = makeMessages(2);

    await sut.notifyNewMessages({
      tenantId,
      accountId: account.id.toString(),
      accountAddress: 'shared@test.com',
      ownerUserId,
      syncedMessages: 2,
      messages,
    });

    // 2 messages x 2 recipients (owner + shared-user) = 4 calls
    expect(mockExecute).toHaveBeenCalledTimes(4);
  });

  it('should not notify when messages array is empty', async () => {
    await sut.notifyNewMessages({
      tenantId,
      accountId,
      accountAddress: 'test@example.com',
      ownerUserId,
      syncedMessages: 0,
      messages: [],
    });

    expect(mockExecute).not.toHaveBeenCalled();
  });
});
