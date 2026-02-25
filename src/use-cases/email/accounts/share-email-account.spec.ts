import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ShareEmailAccountUseCase } from './share-email-account';

let repository: InMemoryEmailAccountsRepository;
let sut: ShareEmailAccountUseCase;

describe('ShareEmailAccountUseCase', () => {
  beforeEach(async () => {
    repository = new InMemoryEmailAccountsRepository();
    sut = new ShareEmailAccountUseCase(repository);

    // Create test account
    await repository.create({
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
  });

  it('should share account with user', async () => {
    const account = await repository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      targetUserId: 'user-2',
      canRead: true,
      canSend: true,
      canManage: false,
    });

    expect(result.access).toBeDefined();
    expect(result.access.userId).toBe('user-2');
    expect(result.access.canRead).toBe(true);
    expect(result.access.canSend).toBe(true);
    expect(result.access.canManage).toBe(false);
  });

  it('should set default permissions for shared account', async () => {
    const account = await repository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      targetUserId: 'user-2',
    });

    expect(result.access.canRead).toBe(true);
    expect(result.access.canSend).toBe(false);
    expect(result.access.canManage).toBe(false);
  });

  it('should grant send permission implies read permission', async () => {
    const account = await repository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      targetUserId: 'user-2',
      canSend: true,
    });

    expect(result.access.canRead).toBe(true);
    expect(result.access.canSend).toBe(true);
  });

  it('should grant manage permission implies all permissions', async () => {
    const account = await repository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      targetUserId: 'user-2',
      canManage: true,
    });

    expect(result.access.canRead).toBe(true);
    expect(result.access.canSend).toBe(false);
    expect(result.access.canManage).toBe(true);
  });

  it('should throw error if account not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: 'invalid-id',
        targetUserId: 'user-2',
      }),
    ).rejects.toThrow('Email account not found');
  });

  it('should throw error if sharing with owner', async () => {
    const account = await repository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: account!.id.toString(),
        targetUserId: 'user-1',
      }),
    ).rejects.toThrow('Cannot share account with the owner');
  });

  it('should throw error if user is not owner and does not have manage permission', async () => {
    const account = await repository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'other-user',
        accountId: account!.id.toString(),
        targetUserId: 'user-2',
      }),
    ).rejects.toThrow('You do not have access to share this account');
  });
});
