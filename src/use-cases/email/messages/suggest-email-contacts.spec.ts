import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SuggestEmailContactsUseCase } from './suggest-email-contacts';

let accountsRepository: InMemoryEmailAccountsRepository;
let messagesRepository: InMemoryEmailMessagesRepository;
let sut: SuggestEmailContactsUseCase;

describe('SuggestEmailContactsUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    messagesRepository = new InMemoryEmailMessagesRepository();

    sut = new SuggestEmailContactsUseCase(
      accountsRepository,
      messagesRepository,
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

    const accountId = account.id.toString();

    // Create messages with various contacts
    // Received from alice@test.com (3 times)
    for (let i = 0; i < 3; i++) {
      await messagesRepository.create({
        tenantId: 'tenant-1',
        accountId,
        folderId: 'folder-1',
        remoteUid: 100 + i,
        fromAddress: 'alice@test.com',
        fromName: 'Alice Smith',
        toAddresses: ['user@example.com'],
        subject: `Message from Alice ${i}`,
        receivedAt: new Date(Date.now() - i * 60000),
      });
    }

    // Received from bob@test.com (1 time)
    await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId,
      folderId: 'folder-1',
      remoteUid: 200,
      fromAddress: 'bob@test.com',
      fromName: 'Bob Jones',
      toAddresses: ['user@example.com'],
      subject: 'Message from Bob',
      receivedAt: new Date(),
    });

    // Sent to charlie@test.com (2 times)
    for (let i = 0; i < 2; i++) {
      await messagesRepository.create({
        tenantId: 'tenant-1',
        accountId,
        folderId: 'folder-sent',
        remoteUid: 300 + i,
        fromAddress: 'user@example.com',
        toAddresses: ['charlie@test.com'],
        subject: `Sent to Charlie ${i}`,
        receivedAt: new Date(Date.now() - i * 60000),
      });
    }

    // CC to diana@test.com (1 time)
    await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId,
      folderId: 'folder-sent',
      remoteUid: 400,
      fromAddress: 'user@example.com',
      toAddresses: ['someone@test.com'],
      ccAddresses: ['diana@test.com'],
      subject: 'CC to Diana',
      receivedAt: new Date(),
    });

    // Unrelated contact (different address, won't match "test.com")
    await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId,
      folderId: 'folder-1',
      remoteUid: 500,
      fromAddress: 'nobody@other.org',
      fromName: 'Nobody',
      toAddresses: ['user@example.com'],
      subject: 'Unrelated',
      receivedAt: new Date(),
    });
  });

  it('should return contacts matching by email', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'alice',
    });

    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0].email).toBe('alice@test.com');
    expect(result.contacts[0].frequency).toBe(3);
  });

  it('should return contacts matching by name', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'Bob Jones',
    });

    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0].email).toBe('bob@test.com');
    expect(result.contacts[0].name).toBe('Bob Jones');
  });

  it('should deduplicate results and aggregate frequency', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'test.com',
    });

    // alice (3 from), bob (1 from), charlie (2 to), diana (1 cc), someone (1 to)
    const emails = result.contacts.map((c) => c.email);
    expect(emails).toContain('alice@test.com');
    expect(emails).toContain('bob@test.com');
    expect(emails).toContain('charlie@test.com');
    expect(emails).toContain('diana@test.com');
    expect(emails).toContain('someone@test.com');

    // Should be sorted by frequency DESC
    expect(result.contacts[0].email).toBe('alice@test.com');
    expect(result.contacts[0].frequency).toBe(3);
  });

  it('should respect limit', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'test.com',
      limit: 2,
    });

    expect(result.contacts).toHaveLength(2);
    // Top 2 by frequency: alice (3), charlie (2)
    expect(result.contacts[0].email).toBe('alice@test.com');
    expect(result.contacts[1].email).toBe('charlie@test.com');
  });

  it('should return empty for no matches', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'nonexistent@nowhere.com',
    });

    expect(result.contacts).toHaveLength(0);
  });

  it('should only search accounts the user has access to', async () => {
    // Create another account owned by user-2
    const otherAccount = await accountsRepository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-2',
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

    // Create a message in the other account with a unique contact
    await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: otherAccount.id.toString(),
      folderId: 'folder-other',
      remoteUid: 600,
      fromAddress: 'secret@private.com',
      fromName: 'Secret Person',
      toAddresses: ['other@example.com'],
      subject: 'Private message',
      receivedAt: new Date(),
    });

    // user-1 should NOT see contacts from user-2's account
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'secret',
    });

    expect(result.contacts).toHaveLength(0);
  });

  it('should include contacts from shared accounts with canRead', async () => {
    // Create account owned by user-2 but shared with user-1
    const sharedAccount = await accountsRepository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-2',
      address: 'shared@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: true,
      username: 'shared@example.com',
      encryptedSecret: 'enc:password',
      isActive: true,
    });

    // Share with user-1 (canRead)
    await accountsRepository.upsertAccess({
      accountId: sharedAccount.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      canRead: true,
    });

    await messagesRepository.create({
      tenantId: 'tenant-1',
      accountId: sharedAccount.id.toString(),
      folderId: 'folder-shared',
      remoteUid: 700,
      fromAddress: 'sharedcontact@shared.com',
      fromName: 'Shared Contact',
      toAddresses: ['shared@example.com'],
      subject: 'Shared message',
      receivedAt: new Date(),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      query: 'sharedcontact',
    });

    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0].email).toBe('sharedcontact@shared.com');
  });

  it('should return empty when user has no accounts', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-with-no-accounts',
      query: 'test',
    });

    expect(result.contacts).toHaveLength(0);
  });
});
