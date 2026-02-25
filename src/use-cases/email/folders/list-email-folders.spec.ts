import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailFoldersRepository } from '@/repositories/email/in-memory/in-memory-email-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListEmailFoldersUseCase } from './list-email-folders';

let accountsRepository: InMemoryEmailAccountsRepository;
let foldersRepository: InMemoryEmailFoldersRepository;
let sut: ListEmailFoldersUseCase;

describe('ListEmailFoldersUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    foldersRepository = new InMemoryEmailFoldersRepository();
    sut = new ListEmailFoldersUseCase(accountsRepository, foldersRepository);

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

    // Create test folders
    await foldersRepository.create({
      accountId: account.id.toString(),
      displayName: 'INBOX',
      remoteName: 'INBOX',
      type: 'INBOX',
      uidValidity: 123,
      lastUid: 100,
    });

    await foldersRepository.create({
      accountId: account.id.toString(),
      displayName: 'Sent',
      remoteName: '[Gmail]/Sent Mail',
      type: 'SENT',
      uidValidity: 124,
      lastUid: 50,
    });

    await foldersRepository.create({
      accountId: account.id.toString(),
      displayName: 'Drafts',
      remoteName: '[Gmail]/Drafts',
      type: 'DRAFTS',
      uidValidity: 125,
      lastUid: 10,
    });
  });

  it('should list folders for account', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
    });

    expect(result.folders).toHaveLength(3);
    expect(result.folders.map((f) => f.type)).toContain('INBOX');
    expect(result.folders.map((f) => f.type)).toContain('SENT');
    expect(result.folders.map((f) => f.type)).toContain('DRAFTS');
  });

  it('should include folder details', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
    });

    const inboxFolder = result.folders.find((f) => f.type === 'INBOX');
    expect(inboxFolder).toBeDefined();
    expect(inboxFolder!.displayName).toBe('INBOX');
    expect(inboxFolder!.remoteName).toBe('INBOX');
  });

  it('should throw error if account not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: 'invalid-id',
      }),
    ).rejects.toThrow('Email account not found');
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

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: otherAccount.id.toString(),
      }),
    ).rejects.toThrow('You do not have access to this account');
  });

  it('should allow access if user has read permission via share', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    // Share account with read permission
    await accountsRepository.upsertAccess({
      accountId: account!.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-2',
      canRead: true,
      canSend: false,
      canManage: false,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-2',
      accountId: account!.id.toString(),
    });

    expect(result.folders).toHaveLength(3);
  });
});
