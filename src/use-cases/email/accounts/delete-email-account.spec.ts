import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteEmailAccountUseCase } from './delete-email-account';

let repository: InMemoryEmailAccountsRepository;
let sut: DeleteEmailAccountUseCase;

describe('DeleteEmailAccountUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryEmailAccountsRepository();
    sut = new DeleteEmailAccountUseCase(repository);
  });

  it('should delete an account owned by user', async () => {
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

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: created.id.toString(),
    });

    expect(repository.items).toHaveLength(0);
  });
});
