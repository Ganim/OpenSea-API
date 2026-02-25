import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetEmailAccountUseCase } from './get-email-account';

let repository: InMemoryEmailAccountsRepository;
let sut: GetEmailAccountUseCase;

describe('GetEmailAccountUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryEmailAccountsRepository();
    sut = new GetEmailAccountUseCase(repository);
  });

  it('should return account for owner', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'owner@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'owner@example.com',
      encryptedSecret: 'enc:secret',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: created.id.toString(),
    });

    expect(result.account.address).toBe('owner@example.com');
  });

  it('should reject when user has no access', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'owner@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'owner@example.com',
      encryptedSecret: 'enc:secret',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        accountId: created.id.toString(),
      }),
    ).rejects.toThrow('access');
  });
});
