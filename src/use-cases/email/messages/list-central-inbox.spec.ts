import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCentralInboxUseCase } from './list-central-inbox';

const tenantId = 'tenant-1';
const userId = 'user-1';

let emailAccountsRepository: InMemoryEmailAccountsRepository;
let emailMessagesRepository: InMemoryEmailMessagesRepository;
let sut: ListCentralInboxUseCase;

describe('ListCentralInboxUseCase', () => {
  beforeEach(() => {
    emailAccountsRepository = new InMemoryEmailAccountsRepository();
    emailMessagesRepository = new InMemoryEmailMessagesRepository();
    sut = new ListCentralInboxUseCase(
      emailAccountsRepository,
      emailMessagesRepository,
    );
  });

  it('should list messages from owned accounts', async () => {
    const account = await emailAccountsRepository.create({
      tenantId,
      ownerUserId: userId,
      address: 'me@test.com',
      imapHost: 'imap.test.com',
      imapPort: 993,
      smtpHost: 'smtp.test.com',
      smtpPort: 465,
      username: 'me@test.com',
      encryptedSecret: 'enc',
    });

    await emailMessagesRepository.create({
      tenantId,
      accountId: account.id.toString(),
      folderId: 'folder-1',
      remoteUid: 1,
      fromAddress: 'sender@test.com',
      toAddresses: ['me@test.com'],
      subject: 'Hello',
      receivedAt: new Date(),
    });

    const result = await sut.execute({
      tenantId,
      userId,
      accountIds: [account.id.toString()],
    });

    expect(result.messages).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
  });

  it('should list messages from accounts with canRead access', async () => {
    const account = await emailAccountsRepository.create({
      tenantId,
      ownerUserId: 'other-user',
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
      userId,
      canRead: true,
    });

    await emailMessagesRepository.create({
      tenantId,
      accountId: account.id.toString(),
      folderId: 'folder-1',
      remoteUid: 1,
      fromAddress: 'someone@test.com',
      toAddresses: ['shared@test.com'],
      subject: 'Shared message',
      receivedAt: new Date(),
    });

    const result = await sut.execute({
      tenantId,
      userId,
      accountIds: [account.id.toString()],
    });

    expect(result.messages).toHaveLength(1);
  });

  it('should throw ForbiddenError when user has no accessible accounts', async () => {
    const account = await emailAccountsRepository.create({
      tenantId,
      ownerUserId: 'other-user',
      address: 'private@test.com',
      imapHost: 'imap.test.com',
      imapPort: 993,
      smtpHost: 'smtp.test.com',
      smtpPort: 465,
      username: 'private@test.com',
      encryptedSecret: 'enc',
    });

    await expect(
      sut.execute({
        tenantId,
        userId,
        accountIds: [account.id.toString()],
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should limit results to max 100', async () => {
    const account = await emailAccountsRepository.create({
      tenantId,
      ownerUserId: userId,
      address: 'me@test.com',
      imapHost: 'imap.test.com',
      imapPort: 993,
      smtpHost: 'smtp.test.com',
      smtpPort: 465,
      username: 'me@test.com',
      encryptedSecret: 'enc',
    });

    const result = await sut.execute({
      tenantId,
      userId,
      accountIds: [account.id.toString()],
      limit: 200,
    });

    expect(result.limit).toBe(100);
  });

  it('should calculate pages correctly', async () => {
    const account = await emailAccountsRepository.create({
      tenantId,
      ownerUserId: userId,
      address: 'me@test.com',
      imapHost: 'imap.test.com',
      imapPort: 993,
      smtpHost: 'smtp.test.com',
      smtpPort: 465,
      username: 'me@test.com',
      encryptedSecret: 'enc',
    });

    for (let i = 0; i < 5; i++) {
      await emailMessagesRepository.create({
        tenantId,
        accountId: account.id.toString(),
        folderId: 'folder-1',
        remoteUid: i + 1,
        fromAddress: 'sender@test.com',
        toAddresses: ['me@test.com'],
        subject: `Message ${i}`,
        receivedAt: new Date(Date.now() - i * 1000),
      });
    }

    const result = await sut.execute({
      tenantId,
      userId,
      accountIds: [account.id.toString()],
      limit: 2,
    });

    expect(result.messages).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.pages).toBe(3);
  });
});
