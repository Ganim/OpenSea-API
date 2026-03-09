import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));
import { UnshareEmailAccountUseCase } from './unshare-email-account';

let repository: InMemoryEmailAccountsRepository;
let sut: UnshareEmailAccountUseCase;

describe('UnshareEmailAccountUseCase', () => {
  beforeEach(async () => {
    repository = new InMemoryEmailAccountsRepository();
    sut = new UnshareEmailAccountUseCase(repository);

    // Create test account
    const account = await repository.create({
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

    // Share account with user-2
    await repository.upsertAccess({
      accountId: account.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-2',
      canRead: true,
      canSend: true,
      canManage: false,
    });
  });

  it('should unshare account with user', async () => {
    const account = await repository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      targetUserId: 'user-2',
    });

    const access = await repository.findAccess(
      account!.id.toString(),
      'user-2',
    );
    expect(access).toBeNull();
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

  it('should throw error if user does not have manage permission', async () => {
    const _account = await repository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    // Create another account owned by different user
    const otherAccount = await repository.create({
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
        targetUserId: 'user-2',
      }),
    ).rejects.toThrow('You do not have access to unshare this account');
  });
});
